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

The frontend must let these three accounts log in. They all use the same password.

Users:

- demo1@ivy.homes
- demo2@ivy.homes
- demo3@ivy.homes

Password:

- demo_password

## Investigation and Engineering Approach

### 1. API discovery and validation

I started by exploring the available Ivy Homes API endpoints using Postman rather than assuming that every documented endpoint was available and behaved exactly as described.

For each endpoint, I checked:

- Whether the endpoint was reachable.
- Which authentication headers or tokens were required.
- The request parameters and payload structure.
- The structure and types of the returned response.
- Pagination behavior.
- Which fields were available for listings, rentals, and projects.
- Whether the documented endpoints actually returned the expected responses.
  The main API areas I validated were authentication, listings, rentals, and projects.

The documented analytics summary endpoint was also tested with the required authentication information, but `/v1/analytics/summary` returned HTTP `404 Not Found`. I therefore did not fabricate analytics data and treated this as an API finding.

### 2. Handling API inconsistencies

One of the important inconsistencies I found was in listing pagination.

The listing response metadata reported:

```
total = 4110
```

However, treating that value as the stopping condition caused retrievable records to be missed.

I tested beyond that boundary:

- `offset = 4399` returned a valid listing.
- `offset = 4400` returned an empty result.
- The complete extraction therefore contained **4400 retrievable listing records**.
  Based on this observation, I changed the extraction logic so that it does not blindly trust the metadata `total`. Pagination continues until the API returns an empty page or indicates that there are no more results.

This was an example where I validated the documented behavior against the actual API behavior before deciding how the application should handle the data.

### 3. Backend proxy and security approach

I used a backend proxy rather than allowing the frontend to communicate directly with the Ivy Homes API.

The frontend communicates with my backend, and the backend forwards authenticated requests to the Ivy Homes API.

This keeps sensitive API credentials and upstream authentication details out of the browser/client code.

The application also uses an HttpOnly server-side session cookie for the authenticated application session. The upstream Ivy access token is kept on the server side rather than being stored in browser local storage or exposed to the frontend.

This approach also allowed the backend to act as a single place for authentication, authorization, upstream API communication, and application-specific persistence.

### 4. Saved listings

The upstream API did not provide a documented favourites endpoint that I could use for the required Saved Listings feature.

Therefore, I implemented the required favourites functionality in my own backend.

A user can:

- Save a listing.
- Remove a saved listing.
- View their saved listings.
- Retain saved listings across browser reloads.
- Retain saved listings after logout and subsequent login.
- Have saved listings isolated from other users.
  The current implementation uses a backend JSON-backed store for this assignment. For a production system, I would replace this with durable database storage so that saved data is not dependent on the lifecycle of the backend filesystem.

### 5. What I checked that turned out to be fine

I also tested several assumptions that did not reveal problems:

- Authentication with the provided API worked.
- The application session remained available after a browser refresh.
- Listing detail pages could be opened directly through their URLs and remained functional after refresh.
- Saved listings persisted across reload and logout/login for the same user.
- Saved listings were isolated between users.
- Rental records could be browsed with usable price and area information.
- Project records could be browsed with usable price and area information.
- Listing pagination terminated correctly once the API actually returned no further records.
- The listing data-quality checks identified specific suspicious/corrupt records rather than treating the entire dataset as invalid.
  These checks were useful because they prevented me from changing parts of the system based only on assumptions.

### 6. Known API findings

The main API behavior I identified during the investigation was:

#### Listing pagination

The listing metadata reported `total = 4110`, while 4400 records were actually retrievable. The implementation therefore uses the actual pagination response rather than relying solely on the reported total.

#### Analytics summary

`/v1/analytics/summary` was requested with the expected authentication information but returned HTTP `404 Not Found`.

I did not substitute fabricated analytics data for the unavailable endpoint.

#### Favourites

A usable upstream favourites endpoint was not available in the API surface I could validate. The required Saved Listings behavior was therefore implemented as application functionality in my backend.

### 7. What I would do with two more days

With two additional days, I would prioritize the following:

1. Replace the JSON-backed saved-listings store with durable database storage suitable for production deployment.
2. Add automated integration tests for authentication, session persistence, pagination, listing details, and saved listings.
3. Investigate the missing analytics endpoint further and determine whether there is an alternative supported analytics API.
4. Investigate the enquiries/fake-listing workflow further if the required upstream endpoint becomes available.
5. Add stronger monitoring and error handling around upstream API failures and timeouts.
6. Expand data-quality validation and make the identified API inconsistencies easier to detect automatically.
7. Improve production deployment configuration, including durable storage and operational observability.
   The priority would be reliability and correctness first, followed by production hardening and additional test coverage.
