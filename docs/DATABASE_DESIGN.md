# Database Design

## raw_posts

Store original content from sources.

Fields:

- id
- source
- title
- content
- url
- score
- created_at

---

## pain_points

Store extracted pain points.

Fields:

- id
- raw_post_id
- pain
- category
- severity
- buying_intent
- created_at

---

## pain_clusters

Group similar pain points.

Fields:

- id
- cluster_name
- description

---

## opportunities

Store scored opportunities.

Fields:

- id
- cluster_id
- score
- frequency
- severity
- buying_intent

---

## startup_ideas

Store generated startup ideas.

Fields:

- id
- opportunity_id
- problem
- solution
- mvp
- pricing
