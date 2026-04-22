# DESIGN.md — Cardappio

## Product Summary

**Cardappio** is a mobile-first meal planning app focused on **weekly food organization**, not just recipe browsing.

The core value proposition is:

> Help users plan lunch and dinner for the week, generate an automatic shopping list, and reduce the daily stress of deciding what to cook.

The app should feel like a mix of:
- weekly planner
- home organization tool
- practical cooking assistant

It should **not** feel like:
- a generic recipe blog
- a content-heavy food portal
- a corporate SaaS dashboard

---

## Core Product Positioning

Cardappio should be positioned as:

**"Your weekly meal plan ready in just a few minutes."**

Main user benefits:
- plan the week faster
- organize lunch and dinner visually
- generate shopping lists automatically
- make cooking easier during busy days
- reduce mental load around food routines at home

---

## Brand Personality

The brand should feel:
- practical
- clean
- friendly
- trustworthy
- organized
- light
- modern
- helpful

Keywords:
- routine
- clarity
- simplicity
- meal planning
- shopping list
- home organization
- time saving
- weekly flow

Tone:
- more human than technical
- more functional than editorial
- more useful than decorative

---

## Visual Direction

The visual identity should be:
- clean
- warm but not rustic
- modern
- soft
- highly readable
- mobile-first
- card-based
- light and organized

The app should communicate:
- ease
- routine
- order
- speed
- domestic usefulness

Avoid:
- overly vibrant palettes
- cluttered layouts
- too many decorative food elements
- dense interfaces
- old-fashioned recipe-site aesthetics
- heavy enterprise dashboard styling

---

## Color Direction

### Primary Color
Use a **fresh green** as the main brand/action color.

This green should represent:
- action
- freshness
- food planning
- positive flow
- weekly progress

Suggested usage:
- primary buttons
- active states
- selected meal slots
- brand accents
- confirmation highlights

### Secondary Accent
Use a **soft warm accent** such as:
- muted orange
- light terracotta
- warm coral

This accent should represent:
- food warmth
- highlights
- featured collections
- subtle promotional emphasis

### Neutral Base
Use very light neutrals:
- off-white backgrounds
- soft warm gray or light beige-gray
- white cards
- subtle gray borders
- medium gray secondary text
- darker neutral for primary text

### Status Colors
Use clean, controlled state colors:
- success: green
- warning: soft amber
- error: controlled red
- info: soft blue

### Overall Color Feeling
The interface should feel:
- fresh
- clean
- domestic
- organized
- pleasant
- calm

---

## Typography Direction

Typography should be:
- sans-serif
- modern
- easy to read on mobile
- strong in headings
- soft and neutral in body text

Recommendations:
- use a clean sans-serif family
- large, simple headings
- medium-weight section titles
- comfortable body size for mobile reading
- strong visual hierarchy

Typography should feel:
- practical
- clear
- organized
- lightweight

---

## Layout Principles

### General Layout
The app should use:
- generous spacing
- strong content hierarchy
- clear sectioning
- modular card layouts
- few actions per block
- obvious primary CTA per screen

### Interface Density
#### Public area
- more spacious
- slightly more commercial
- storytelling blocks allowed

#### User app area
- more functional
- more direct
- still soft and welcoming
- task-oriented

#### Admin area
- can be more operational and dense
- not priority for initial Stitch exploration

### Card-Based Design
Cards should be a major structural element for:
- recipe previews
- weekly plan blocks
- shopping list modules
- dashboard summaries
- collections
- premium prompts

---

## Product Areas

The product is divided into 3 areas:

### 1. Public Website
Purpose:
- explain the product
- convert visitors
- show plans
- answer FAQ
- support access/login

### 2. Authenticated User Area
Purpose:
- main app experience
- weekly planning
- recipe selection
- shopping list usage
- favorites and history
- user preferences

### 3. Admin Area
Purpose:
- recipe management
- category/tag management
- collections
- editorial highlights
- notifications
- subscriptions and user management

For Stitch, prioritize:
- public website
- authenticated user experience

---

## Main User Journey

The primary user flow should feel simple and progressive:

1. Understand the product
2. Sign up or log in
3. Complete a short onboarding
4. Build the first week
5. Review the weekly meal plan
6. Generate the shopping list
7. Use recipes throughout the week
8. Return next week to repeat or adjust

The app should encourage recurring weekly behavior.

---

## Core Screens to Design

### Public Screens

#### 1. Landing Page
Goal:
- explain value clearly
- convert visitors into users

Suggested sections:
- header with logo and CTA
- hero with main value proposition
- app preview/mockup
- how it works in 3–4 steps
- benefits section
- automatic shopping list highlight
- pricing teaser
- FAQ
- final CTA
- footer

#### 2. How It Works
Goal:
- explain the user journey step by step

#### 3. Plans / Pricing
Goal:
- compare free vs premium clearly

#### 4. FAQ / Support
Goal:
- reduce hesitation and answer practical questions

---

### Authentication Screens

#### 5. Login / Signup
Goal:
- simple entry into the app

Include:
- email
- password or simplified access flow
- primary action button
- create account link
- forgot access link
- soft visual support image or illustration

#### 6. Onboarding
Goal:
- collect minimum preferences needed to personalize the experience

Suggested questions:
- how many people are eating at home?
- do you want to plan lunch, dinner, or both?
- how many days do you usually plan?
- do you have food preferences or restrictions?
- what is your main goal?

Examples of goals:
- save time
- save money
- eat better
- plan family meals
- vary meals during the week

Design notes:
- short multi-step flow
- subtle progress indicator
- few inputs per screen
- calm, guided experience

---

### Authenticated App Screens

#### 7. Dashboard / Home
Goal:
- recurring entry point for the app

Should show:
- current week summary
- primary CTA to create or edit the week
- quick access to shopping list
- favorites shortcut
- recommended collections or suggestions
- optional lightweight premium banner

The dashboard should feel:
- welcoming
- direct
- useful
- not overly dense

#### 8. Weekly Planner
Goal:
- main screen of the product

Should include:
- clear title
- days of the week
- lunch and dinner slots
- empty and filled states
- add recipe action
- replace/remove recipe actions
- save week CTA
- review shopping list CTA

This screen should be:
- extremely clear
- visually structured
- fast to understand
- excellent on mobile

#### 9. Recipe Picker
Goal:
- allow users to find and select a recipe for a meal slot

Should include:
- search field
- quick filters
- categories
- collections
- recipe cards
- favorite recipes access
- select action

Recipe card should show:
- image
- title
- prep time
- difficulty
- cost
- key tags

#### 10. Recipe Detail
Goal:
- support both selection and actual cooking

Should include:
- image
- title and subtitle
- prep time / difficulty / cost / servings badges
- ingredients list
- step-by-step instructions
- notes or tips
- add to plan CTA
- favorite button

This screen should prioritize:
- readability
- practical use
- execution over decoration

#### 11. Weekly Meal Plan View
Goal:
- show the finished week clearly

Should include:
- days with lunch and dinner
- compact recipe summaries
- edit actions
- open recipe action
- go to shopping list CTA
- print/share CTA

#### 12. Shopping List
Goal:
- be extremely practical in real-life use

Should include:
- checklist items
- grouped or clearly ordered ingredients
- remove item action
- repeated-ingredient clarity
- share/print CTA

This screen should feel:
- utility-first
- clean
- fast to scan
- easy to use at the market

#### 13. Favorites
Goal:
- quick access to preferred recipes

Should include:
- recipe grid or list
- simple filters
- use in planning CTA

#### 14. History
Goal:
- help repeat past weeks and reduce effort

Should include:
- previous weeks list
- short summary per week
- duplicate week action
- reuse week action

#### 15. Profile & Preferences
Goal:
- adjust account and meal planning preferences

Should include:
- account information
- household size
- meal preferences
- food restrictions
- planning defaults
- notifications
- current subscription info

#### 16. Upgrade / Subscription
Goal:
- present premium value inside the app

Should include:
- current plan
- free vs premium comparison
- premium feature highlights
- upgrade CTA

---

## Navigation Recommendations

### Public Navigation
Use a simple top navigation:
- Home
- How it Works
- Plans
- FAQ
- Login

### Authenticated Mobile Navigation
Use a very simple mobile-first navigation:
- Home
- Week
- Shopping
- Favorites
- Profile

### Persistent Quick Access
Users should always be able to reach quickly:
- weekly planner
- shopping list
- today’s recipe

---

## Reusable UI Components

Create a reusable component system in Stitch.

### Structural Components
- public header
- footer
- app shell
- mobile bottom navigation
- light desktop sidebar
- section headers
- summary cards

### Product Components
- recipe card
- day card
- meal slot block
- week summary block
- shopping list block
- checklist item row
- category chip
- tag chip
- prep/difficulty/cost badge
- add recipe CTA
- generate shopping list CTA

### State Components
- empty week state
- empty favorites state
- empty history state
- loading state
- success feedback
- premium locked-state prompt

---

## Empty State Guidelines

Design calm and helpful empty states.

### Empty Week
Suggested tone:
- You haven’t planned your week yet.
- Choose your days and recipes to get started.

### Empty Favorites
Suggested tone:
- Save your favorite recipes to plan faster next time.

### Empty History
Suggested tone:
- Your past meal plans will appear here for easy reuse.

---

## Premium Presentation Guidelines

Premium should feel elegant and unobtrusive.

Use:
- subtle banners
- feature badges
- soft lock states
- clean upgrade comparison sections

Avoid:
- aggressive upsell clutter
- too many interruptions
- loud promotional visuals inside the main planning flow

---

## Illustration & Imagery Guidance

### Recipe Photos
Recipe imagery is important, but should not overpower the product.

Cardappio is primarily a **planning tool**, not a content feed.

### Illustration Style
If illustrations are used, they should be:
- soft
- minimal
- friendly
- related to planning, groceries, cooking, and weekly routine

Avoid:
- childish cartoon style
- overly playful food mascots
- highly decorative scenes

### Icon Style
Icons should be:
- simple
- consistent
- outline or softly filled
- modern and easy to read

---

## Stitch Priorities

### Phase 1 — Core Experience
Design first:
1. Landing Page
2. Login / Signup
3. Onboarding
4. Dashboard
5. Weekly Planner
6. Recipe Picker
7. Recipe Detail
8. Weekly Meal Plan View
9. Shopping List

### Phase 2 — Retention & Monetization
Then design:
10. Favorites
11. History
12. Profile & Preferences
13. Upgrade / Subscription
14. How It Works
15. Plans
16. FAQ

### Phase 3 — Expansion
Later:
17. Sharing flows
18. Collections
19. Notifications
20. Admin starting point

---

## Base Prompt for Stitch

Use this as the primary generation prompt:

> Create a mobile-first interface for an app called Cardappio, focused on weekly meal planning. The product should feel clean, modern, light, organized, and practical. It should not feel like a generic recipe catalog, but like a home meal-planning and shopping-list assistant. Prioritize excellent mobile usability, card-based layouts, clear hierarchy, generous spacing, intuitive navigation, and a friendly but functional visual identity. Use a fresh green as the main action color, light neutrals as the foundation, and subtle warm accents for food-related highlights. The experience should communicate routine simplification, time saving, clarity, and domestic organization.

---

## Extra Prompt — Dashboard

> Create a dashboard for a weekly meal planning app. Show the current week summary, a primary CTA to create or edit the week, quick access to the shopping list, favorites, and light recipe suggestions. The interface should feel clean, welcoming, useful, and mobile-first, with light cards and clear actions.

---

## Extra Prompt — Weekly Planner

> Create the main weekly meal planning screen for an app. Show days of the week with lunch and dinner slots, empty and filled states, actions to add, replace, or remove recipes, and CTAs to save the week or review the shopping list. The layout should be extremely clear, fast to understand, and optimized for mobile.

---

## Extra Prompt — Recipe Detail

> Create a recipe detail screen for a meal planning app. Include recipe image, title, subtitle, prep time, difficulty, cost, servings, ingredient list, step-by-step instructions, notes, favorite button, and add-to-plan CTA. Prioritize readability and cooking usability over editorial decoration.

---

## Extra Prompt — Shopping List

> Create a shopping list screen for a weekly meal planning app. Show ingredients as checklist items, grouped or ordered clearly, with a clean utility-first interface, fast scanning, and options to share or print. The screen should feel practical, simple, and efficient for real use at the grocery store.

---

## Final Design Goal

Every screen should reinforce this idea:

> Cardappio helps people organize meals for the week with clarity, speed, and less stress.

The final design system should support:
- weekly planning
- recipe selection
- shopping list execution
- recurring home use
- visual clarity
- mobile-first interaction

