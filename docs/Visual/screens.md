# SCREENS.md — Cardappio

## Purpose

This document defines the main screens for **Cardappio** in a practical, screen-by-screen format for design exploration in Stitch.

It complements `DESIGN.md`.

Each screen includes:
- screen name
- purpose
- user goal
- key sections
- main components
- user actions
- states
- priority

The product is a **mobile-first weekly meal planning app**.
It should feel practical, clean, welcoming, and highly usable.

---

# 1. Public Website Screens

## Screen 01 — Public Landing Page

### Purpose
Present Cardappio clearly and convert visitors into users.

### User Goal
Understand what the app does and decide whether to sign up.

### Key Sections
- top navigation
- hero section
- product preview/mockup
- how it works section
- main benefits
- shopping list highlight
- meal planning routine section
- pricing teaser
- FAQ preview
- final CTA
- footer

### Main Components
- logo
- primary CTA button
- secondary CTA
- hero headline
- supporting paragraph
- app mockup image
- benefit cards
- step cards
- pricing summary cards
- FAQ accordion preview

### User Actions
- click sign up
- click login
- scroll through benefits
- navigate to plans
- navigate to how it works

### States
- default
- mobile stacked layout
- CTA hover/active

### Priority
**P1**

---

## Screen 02 — How It Works

### Purpose
Explain the main product journey with clarity.

### User Goal
Understand the weekly flow before creating an account.

### Key Sections
- headline
- 3 to 5 step explanation
- visual progression
- practical examples
- CTA to sign up

### Main Components
- step cards
- icons or light illustrations
- short explanatory text
- CTA banner

### User Actions
- read flow
- continue to sign up
- compare with plans

### States
- default
- mobile stacked layout

### Priority
**P2**

---

## Screen 03 — Plans / Pricing

### Purpose
Show the difference between free and premium.

### User Goal
Understand what is included in each plan.

### Key Sections
- pricing headline
- free vs premium comparison
- value highlights
- FAQ snippet about billing
- CTA to start

### Main Components
- plan cards
- comparison table or feature comparison blocks
- badges for recommended plan
- CTA buttons

### User Actions
- compare plans
- choose a plan
- start with free
- start premium

### States
- monthly/yearly toggle if needed
- highlighted recommended plan
- mobile responsive stacked comparison

### Priority
**P2**

---

## Screen 04 — FAQ / Support

### Purpose
Answer objections and reduce friction.

### User Goal
Clarify practical doubts before signup or subscription.

### Key Sections
- FAQ list
- common use cases
- contact/support CTA

### Main Components
- accordion list
- support card
- contact CTA

### User Actions
- open FAQ items
- go to support/contact

### States
- accordion expanded/collapsed

### Priority
**P2**

---

# 2. Authentication & Onboarding

## Screen 05 — Login / Signup

### Purpose
Allow users to enter or create an account.

### User Goal
Access the app quickly and with confidence.

### Key Sections
- brand header
- login form
- signup link
- forgot access link
- optional side visual support

### Main Components
- email field
- password field or simplified access method
- primary action button
- secondary text links
- logo

### User Actions
- log in
- create account
- recover access

### States
- empty form
- loading
- validation error
- success/redirect

### Priority
**P1**

---

## Screen 06 — Onboarding Step Flow

### Purpose
Collect the minimum preferences needed to personalize the experience.

### User Goal
Set up the app quickly for their household routine.

### Key Sections
- step header
- progress indicator
- one short question per step
- CTA area

### Main Components
- radio groups
- chips/selectable options
- next/back buttons
- progress bar

### Suggested Questions
- household size
- lunch, dinner, or both
- how many days to plan
- food preferences or restrictions
- main goal

### User Actions
- select answers
- move to next step
- go back
- finish onboarding

### States
- step 1
- intermediate steps
- final step
- incomplete state
- completion state

### Priority
**P1**

---

# 3. Authenticated App Screens

## Screen 07 — Dashboard / App Home

### Purpose
Serve as the main recurring entry point.

### User Goal
Understand the status of the current week and quickly continue where they left off.

### Key Sections
- greeting / page title
- current week summary
- main CTA to create or edit week
- quick link to shopping list
- favorites shortcut
- suggestions / featured collections
- optional premium prompt

### Main Components
- summary cards
- progress/status block
- CTA buttons
- suggestion cards
- small banner or tip card

### User Actions
- create week
- edit week
- open shopping list
- open favorites
- open a suggested collection

### States
- empty week state
- week in progress
- completed week
- premium banner visible/hidden

### Priority
**P1**

---

## Screen 08 — Weekly Planner

### Purpose
Be the main product screen where users build the week.

### User Goal
Plan lunch and dinner for selected days with minimal friction.

### Key Sections
- page title
- day selector or day list
- meal slots (lunch/dinner)
- add recipe actions
- selected recipe summaries
- save week CTA
- review shopping list CTA

### Main Components
- day cards or expandable day blocks
- meal slot blocks
- add recipe button
- selected recipe mini-card
- remove/replace actions
- floating or sticky action bar if useful

### User Actions
- add a recipe to a meal slot
- replace a selected recipe
- remove a selected recipe
- save the plan
- go review shopping list

### States
- empty planner
- partially filled week
- fully planned week
- loading selection state
- save success state

### Priority
**P1**

---

## Screen 09 — Recipe Picker

### Purpose
Help users find and select the right recipe for a specific meal slot.

### User Goal
Choose a recipe quickly.

### Key Sections
- search bar
- filter row
- category section
- collections section
- recipe results grid/list

### Main Components
- search input
- quick filter chips
- category chips
- collection cards
- recipe cards
- select action on each recipe

### User Actions
- search recipes
- filter recipes
- browse categories
- browse collections
- open recipe detail
- select recipe for the slot

### States
- default results
- filtered results
- no results
- loading results

### Priority
**P1**

---

## Screen 10 — Recipe Detail

### Purpose
Support recipe selection and cooking execution.

### User Goal
Understand the recipe and either choose it for the week or use it while cooking.

### Key Sections
- hero/image section
- recipe summary
- ingredient list
- step-by-step instructions
- notes/tips
- actions area

### Main Components
- image
- title and subtitle
- prep time badge
- difficulty badge
- cost badge
- servings badge
- ingredient checklist-style list
- instruction steps
- favorite button
- add to plan button

### User Actions
- add to weekly plan
- mark as favorite
- read full recipe
- go back to recipe picker

### States
- default
- favorited
- loading
- add-to-plan success state

### Priority
**P1**

---

## Screen 11 — Weekly Meal Plan View

### Purpose
Show the completed weekly plan clearly.

### User Goal
Review the week and quickly access meals or next actions.

### Key Sections
- page title / week label
- days list
- lunch/dinner recipe entries
- actions toolbar

### Main Components
- day cards
- compact recipe rows
- edit action
- open recipe action
- print/share button
- shopping list CTA

### User Actions
- open recipe
- edit a day
- edit the entire week
- go to shopping list
- print/share

### States
- default complete week
- partially complete week
- empty week

### Priority
**P1**

---

## Screen 12 — Shopping List

### Purpose
Turn the weekly plan into a highly usable list for real shopping.

### User Goal
Use the generated ingredient list with minimal friction.

### Key Sections
- page title
- shopping list summary
- grouped ingredients or ordered ingredient list
- action footer/header

### Main Components
- checklist items
- grouped ingredient sections
- repeated-ingredient indicators if needed
- remove item action
- share button
- print button

### User Actions
- check items off
- remove items
- share the list
- print the list
- go back to meal plan

### States
- default list
- grouped list
- all items checked
- empty list

### Priority
**P1**

---

## Screen 13 — Favorites

### Purpose
Provide quick access to saved recipes.

### User Goal
Reuse preferred recipes easily.

### Key Sections
- page title
- favorites list or grid
- optional quick filters

### Main Components
- recipe cards
- remove favorite action
- add to plan CTA
- filter chips

### User Actions
- open favorite recipe
- remove from favorites
- use in weekly planning

### States
- filled favorites
- empty favorites

### Priority
**P2**

---

## Screen 14 — History

### Purpose
Make it easy to reuse past weeks.

### User Goal
Repeat or adapt previous meal plans.

### Key Sections
- page title
- previous weeks list
- summary blocks per week

### Main Components
- week summary card
- duplicate week button
- reuse week button
- view week details action

### User Actions
- open past week
- duplicate a week
- reuse a week as starting point

### States
- filled history
- empty history

### Priority
**P2**

---

## Screen 15 — Profile & Preferences

### Purpose
Let users manage account info and planning preferences.

### User Goal
Adjust the app to fit their household routine.

### Key Sections
- account section
- household settings
- food preferences
- notifications
- subscription summary

### Main Components
- input fields
- option chips
- toggles
- save button
- current plan block

### User Actions
- update preferences
- update account data
- manage notifications
- view subscription

### States
- default
- edit mode
- save success
- validation error

### Priority
**P2**

---

## Screen 16 — Upgrade / Subscription

### Purpose
Explain premium value inside the app.

### User Goal
Understand why upgrading is worth it.

### Key Sections
- current plan summary
- premium feature highlights
- free vs premium comparison
- CTA area

### Main Components
- plan comparison cards
- premium highlight cards
- upgrade CTA
- FAQ snippet if needed

### User Actions
- start premium
- compare plans
- go back

### States
- free user state
- premium active state

### Priority
**P2**

---

# 4. Secondary / Expansion Screens

## Screen 17 — Collections

### Purpose
Group recipes into useful thematic sets.

### User Goal
Find curated recipes based on context.

### Key Sections
- featured collection header
- collection list
- collection detail grid/list

### Main Components
- collection cards
- recipe cards
- premium badges if needed

### User Actions
- open collection
- browse recipes
- add recipe to plan

### States
- free collection
- premium locked collection

### Priority
**P3**

---

## Screen 18 — Notifications / Tips

### Purpose
Show light editorial prompts or reminders.

### User Goal
See relevant suggestions without distraction.

### Key Sections
- recent notifications
- weekly tips
- promotional highlights if subtle

### Main Components
- notification rows
- tip cards
- action links

### User Actions
- open notification
- dismiss message
- follow CTA

### States
- unread notifications
- empty notifications

### Priority
**P3**

---

## Screen 19 — Share / Print Options

### Purpose
Help users export or share their meal plan or shopping list.

### User Goal
Send or print useful outputs for home use.

### Key Sections
- share options
- print preview summary
- what to include toggle

### Main Components
- option cards
- toggles
- share button
- print button

### User Actions
- share week
- share shopping list
- print week
- print shopping list

### States
- default
- preview state

### Priority
**P3**

---

# 5. Admin Starting Point Screens

## Screen 20 — Admin Recipes List

### Purpose
Give operators a clear entry point for recipe management.

### User Goal
Review and manage recipe content efficiently.

### Key Sections
- page title
- filters
- recipe table/list
- create recipe action

### Main Components
- search field
- category filter
- status filter
- table or dense list
- create button
- row actions

### User Actions
- create recipe
- edit recipe
- archive recipe
- filter recipes

### States
- populated state
- empty state
- filtered state

### Priority
**P3**

---

## Screen 21 — Admin Recipe Editor

### Purpose
Allow admins to create and update recipe content.

### User Goal
Manage recipe structure consistently.

### Key Sections
- basic recipe info
- image upload area
- ingredients section
- instructions section
- categorization section
- publish controls

### Main Components
- text fields
- textarea
- structured list builder
- tags/categories selectors
- save/publish actions

### User Actions
- add/edit content
- upload image
- save draft
- publish recipe

### States
- empty create state
- edit existing state
- save success
- validation error

### Priority
**P3**

---

# 6. Global Experience Notes

## Mobile Priority
All screens must be designed mobile-first.

Important qualities:
- quick scanability
- large enough tap targets
- clear primary actions
- reduced complexity per screen
- strong hierarchy

## Interface Feel
The interface should feel:
- light
- useful
- welcoming
- highly organized
- easy to understand in seconds

## Product Reminder
Cardappio is not just a recipe app.
It is a **weekly meal planning and shopping flow product**.

Every screen should reinforce:
- weekly organization
- meal selection
- shopping preparation
- practical home use

---

# 7. Screen Priorities Summary

## P1 — Core
- Public Landing Page
- Login / Signup
- Onboarding
- Dashboard
- Weekly Planner
- Recipe Picker
- Recipe Detail
- Weekly Meal Plan View
- Shopping List

## P2 — Retention & Monetization
- How It Works
- Plans / Pricing
- FAQ / Support
- Favorites
- History
- Profile & Preferences
- Upgrade / Subscription

## P3 — Expansion
- Collections
- Notifications / Tips
- Share / Print Options
- Admin Recipes List
- Admin Recipe Editor

---

# Final Goal

Use these screens to create a design system and screen flow that makes Cardappio feel like:

> a smart, calm, and practical weekly meal planning app for real household use

