def _answers(form, **overrides):
    q = {x["title"]: x for x in form["questions"]}
    values = {
        "Name": "Anjali",
        "Email": "anjali@example.com",
        "Pick": q["Pick"]["options"][0]["id"],
        "Rate": 4,
        "Age": 30,
        "Agree?": "yes",
        **overrides,
    }
    return {"answers": [{"question_id": q[t]["id"], "value": v} for t, v in values.items()]}


def test_full_flow(client, published_form):
    slug = published_form["slug"]
    public = client.get(f"/api/public/forms/{slug}")
    assert public.status_code == 200
    assert len(public.json()["questions"]) == 6

    r = client.post(f"/api/public/forms/{slug}/responses", json=_answers(published_form))
    assert r.status_code == 201

    forms = client.get("/api/forms").json()
    assert forms[0]["response_count"] == 1
    assert forms[0]["status"] == "published"

    responses = client.get(f"/api/forms/{published_form['id']}/responses").json()
    values = {a["value"] for a in responses[0]["answers"]}
    assert {"Anjali", "A", 4.0, "yes"} <= values


def test_required_and_format_validation(client, published_form):
    slug = published_form["slug"]
    bad = _answers(published_form, Name="  ", Email="not-an-email", Age=500)
    r = client.post(f"/api/public/forms/{slug}/responses", json=bad)
    assert r.status_code == 422
    errors = r.json()["detail"]["errors"]
    assert len(errors) == 3
    assert "Please fill this in" in errors.values()


def test_invalid_choice_rejected(client, published_form):
    r = client.post(f"/api/public/forms/{published_form['slug']}/responses",
                    json=_answers(published_form, Pick=999999))
    assert r.status_code == 422


def test_draft_form_is_not_public(client, published_form):
    client.post(f"/api/forms/{published_form['id']}/unpublish")
    assert client.get(f"/api/public/forms/{published_form['slug']}").status_code == 404


def test_cannot_publish_empty_form(client):
    form = client.post("/api/forms", json={}).json()
    assert client.post(f"/api/forms/{form['id']}/publish").status_code == 400


def test_reorder_and_soft_delete_keep_old_answers(client, published_form):
    form_id = published_form["id"]
    client.post(f"/api/public/forms/{published_form['slug']}/responses", json=_answers(published_form))

    # Reverse the order and drop the "Name" question.
    kept = [q for q in published_form["questions"] if q["title"] != "Name"][::-1]
    updated = client.put(f"/api/forms/{form_id}/questions", json={"questions": kept}).json()
    assert [q["title"] for q in updated["questions"]] == [q["title"] for q in kept]
    assert "Name" not in [q["title"] for q in updated["questions"]]

    # The earlier response still holds its answer to the deleted question.
    response = client.get(f"/api/forms/{form_id}/responses").json()[0]
    assert "Anjali" in [a["value"] for a in response["answers"]]


def test_duplicate(client, published_form):
    copy = client.post(f"/api/forms/{published_form['id']}/duplicate").json()
    assert copy["status"] == "draft"
    assert copy["slug"] != published_form["slug"]
    assert len(copy["questions"]) == len(published_form["questions"])
    assert copy["questions"][2]["options"][0]["label"] == "A"


def test_summary_and_csv(client, published_form):
    slug, form_id = published_form["slug"], published_form["id"]
    pick = {q["title"]: q for q in published_form["questions"]}["Pick"]
    client.post(f"/api/public/forms/{slug}/responses", json=_answers(published_form))
    client.post(f"/api/public/forms/{slug}/responses",
                json=_answers(published_form, Pick=pick["options"][1]["id"], Rate=2))

    summary = client.get(f"/api/forms/{form_id}/summary").json()
    assert summary["total_responses"] == 2
    by_title = {q["title"]: q for q in summary["questions"]}
    assert [o["count"] for o in by_title["Pick"]["stats"]["options"]] == [1, 1]
    assert by_title["Rate"]["stats"]["average"] == 3.0

    csv = client.get(f"/api/forms/{form_id}/export.csv")
    assert csv.headers["content-type"].startswith("text/csv")
    assert csv.text.count("\n") == 3  # header + 2 rows


def test_delete_form_cascades(client, published_form):
    client.post(f"/api/public/forms/{published_form['slug']}/responses", json=_answers(published_form))
    assert client.delete(f"/api/forms/{published_form['id']}").status_code == 204
    assert client.get(f"/api/forms/{published_form['id']}").status_code == 404


def test_start_then_submit_tracks_completion(client, published_form):
    slug, form_id = published_form["slug"], published_form["id"]
    finished = client.post(f"/api/public/forms/{slug}/start").json()["response_id"]
    client.post(f"/api/public/forms/{slug}/start")  # this person drops out

    body = {**_answers(published_form), "response_id": finished}
    assert client.post(f"/api/public/forms/{slug}/responses", json=body).json()["response_id"] == finished

    summary = client.get(f"/api/forms/{form_id}/summary").json()
    assert summary["total_started"] == 2
    assert summary["total_responses"] == 1
    assert summary["completion_rate"] == 50.0
    # Unfinished responses don't appear in the list or the count.
    assert len(client.get(f"/api/forms/{form_id}/responses").json()) == 1


def test_response_id_cannot_be_reused(client, published_form):
    slug = published_form["slug"]
    rid = client.post(f"/api/public/forms/{slug}/start").json()["response_id"]
    body = {**_answers(published_form), "response_id": rid}
    client.post(f"/api/public/forms/{slug}/responses", json=body)
    # A second submit with the same id creates a new response instead of overwriting.
    second = client.post(f"/api/public/forms/{slug}/responses", json=body).json()["response_id"]
    assert second != rid
