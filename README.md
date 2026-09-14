# Ivy Homes Internship Assignment

This repository contains a Vite + React frontend and an Express backend proxy for the Ivy Homes API.

## Local setup

```sh
cd backend
npm install
npm start
```

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

## Demo accounts

The frontend supports these three demo accounts. They all use the same password.

Users:

* [demo1@ivy.homes](mailto:demo1@ivy.homes)
* [demo2@ivy.homes](mailto:demo2@ivy.homes)
* [demo3@ivy.homes](mailto:demo3@ivy.homes)

Password:

```text
demo_password
```

## Investigation and Engineering Approach

### 1. API discovery and validation

I started by exploring the available Ivy Homes API endpoints using Postman rather than assuming that every documented endpoint was available and behaved exactly as described.

For each endpoint, I checked:

* Whether the endpoint was reachable.
* Which authentication headers or tokens were required.
* The request parameters and payload structure.
* The structure and types of the returned response.
* Pagination behavior.
* Which fields were available for listings, rentals, and projects.
* Whether documented response metadata matched the records actually retrievable from the API.
* Whether related datasets were internally consistent.

The main API areas I validated were authentication, listings, rentals, projects, and the documented analytics endpoint.

### 2. How I identified documentation that should not be trusted blindly

I treated documentation values as claims to validate rather than as guaranteed ground truth.

The clearest example was the `/v1/listings` endpoint. Its response metadata reported:

```text
total = 4110
```

I did not stop pagination at 4110. Instead, I continued requesting subsequent pages and observed that:

* `offset = 4399` returned a valid listing.
* `offset = 4400` returned an empty result.
* The complete unfiltered extraction therefore contained **4400 retrievable listing records**.

This showed that the reported `total` could not safely be used as the stopping condition.

I therefore changed the extraction logic to continue pagination until the API returned an empty page or otherwise indicated that there were no more records.

This was important for the assignment because several answers depend on the complete retrievable dataset.

### 3. Data sources used for the assignment

I kept the API datasets separate according to their purpose:

* **Listings** → `/v1/listings`
* **Rentals** → `/v1/rentals`
* **Projects** → `/v1/projects`

The assignment answers were calculated from the appropriate dataset rather than assuming that all questions used listing records.

For example:

* Q1, Q2, Q3, Q4, Q6 and Q8 use listing records.
* Q5 uses rental records.
* Q7 uses project records.
* Q10 compares project-level reported counts with actual listing records.

### 4. Backend proxy and security approach

I used a backend proxy rather than allowing the frontend to communicate directly with the Ivy Homes API.

The frontend communicates with my backend, and the backend forwards authenticated requests to the Ivy Homes API.

This keeps the upstream API credential out of the browser/client code.

The application also uses an HttpOnly server-side session cookie for the authenticated application session. The upstream Ivy access token is kept on the server side rather than being stored in browser local storage or exposed to the frontend.

This approach also gives the backend a single place for authentication, authorization, upstream API communication, and application-specific persistence.

### 5. Saved listings

The upstream API did not provide a documented favourites endpoint that I could use for the required Saved Listings feature.

Therefore, I implemented the required favourites functionality in my own backend.

A user can:

* Save a listing.
* Remove a saved listing.
* View their saved listings.
* Retain saved listings across browser reloads.
* Retain saved listings after logout and subsequent login.
* Have saved listings isolated between users.

The current implementation uses a backend JSON-backed store for this assignment. For a production system, I would replace this with durable database storage so that saved data is not dependent on the lifecycle of the backend filesystem.

### 6. What I checked that turned out to be fine

I also tested several assumptions that did not reveal problems. I intentionally record these because they helped distinguish actual API/data issues from hypotheses.

I verified that:

* Authentication with the provided API worked.
* The application session remained available after a browser refresh.
* Listing detail pages could be opened directly through their URLs and remained functional after refresh.
* Saved listings persisted across reload and logout/login for the same user.
* Saved listings were isolated between users.
* Rental records could be retrieved and contained usable price and area information.
* Project records could be retrieved and contained usable price and area information.
* Listing pagination eventually terminated when the API returned no further records.
* Suspicious listing records were not automatically treated as fake listings without sufficient evidence.
* Repeated contacts or similar/duplicate descriptions were not by themselves treated as proof of fraudulent listings.
* `is_verified = false` was not treated as equivalent to a fake listing.
* Suspicious price outliers were investigated rather than automatically classified as fake listings.

These checks prevented me from turning weak signals into unsupported conclusions.

### 7. Data-quality and consistency findings

#### Listing pagination

The `/v1/listings` metadata reported `total = 4110`, while **4400 records** were actually retrievable through complete unfiltered pagination.

I therefore used the actual pagination termination condition rather than relying solely on the reported total.

#### Project listing counts

The `/v1/projects` response contains a `total_listings` value for projects.

I compared these reported values against the actual number of retrievable `/v1/listings` records grouped by `project_id`.

The counts differed for **363 projects**.

I therefore used the actual retrievable listing records when answering the consistency-related question rather than assuming that the project metadata was always authoritative.

#### Analytics summary

I also tested the documented `/v1/analytics/summary` endpoint with the expected authentication information.

The endpoint returned:

```text
HTTP 404 Not Found
```

I did not fabricate analytics data or substitute an unrelated endpoint.

#### Fake listings

I investigated potential fake/enquiry-generation listings using multiple signals, including suspicious pricing, verification status, repeated contacts, duplicate descriptions, and explicit enquiry/fake/test-related wording.

These checks produced suspicious candidates, but I did not find sufficiently strong evidence to confidently classify those records as intentionally fake listings created to generate enquiries.

Therefore, Q9 was kept as an empty list rather than inventing IDs from weak signals.

### 8. What I would do with two more days

With two additional days, I would prioritize:

1. Replace the JSON-backed saved-listings store with durable database storage suitable for production deployment.
2. Add automated integration tests for authentication, session persistence, pagination, listing details, and saved listings.
3. Investigate the missing analytics endpoint further and determine whether there is an alternative supported analytics API.
4. Investigate the enquiries/fake-listing workflow further if the required upstream endpoint becomes available.
5. Add stronger monitoring and error handling around upstream API failures and timeouts.
6. Expand automated data-quality validation so API inconsistencies can be detected automatically.
7. Improve production deployment configuration, including durable persistence and operational observability.
8. Add more frontend edge-case handling for empty states, API failures, and slow upstream responses.

The priority would be reliability and correctness first, followed by production hardening and additional test coverage.

## LLM and Library Disclosure

I used standard development tools and libraries appropriate for the implementation. I also used LLM assistance during development for reasoning, debugging, and implementation support.

The final API investigation and assignment answers were independently validated against the records retrieved from the API rather than being accepted from an LLM without verification.

## Assignment Answer Summary

| Question                          |                Answer |
| --------------------------------- | --------------------: |
| Total listing records             |                  4400 |
| Unique properties                 |                  4365 |
| Active listings                   |                  3477 |
| Corrupt listing IDs               |                    30 |
| Total monthly rent                |            ₹5,506,600 |
| Average 2-BHK price/sqft          |            ₹17,914.95 |
| Costliest project                 | P20165 — ₹998,000,000 |
| Listings in last 7 days           |                   141 |
| Fake listing IDs                  |                    [] |
| Projects with wrong listing count |                   363 |
