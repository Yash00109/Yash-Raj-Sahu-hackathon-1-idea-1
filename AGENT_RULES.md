# Sidrería Iturrieta — Project Rules

## 1. Product goal

Build a premium, responsive, multilingual reservation website for Sidrería Iturrieta, a traditional Basque cider house in Aramaio, Álava, Spain.

The frontend must be exceptional from the first working version. The product must combine an immersive, responsive 3D or depth-based visual experience, authentic photography of the actual venue, and a genuinely functional reservation journey.

Official website: https://www.iturrieta.eus/

## 2. Development strategy

Follow this cycle:

**Build → Test → Verify → Deploy → Verify again → Add one feature → Repeat.**

Start with a minimal but complete baseline. Do not implement the entire future product in one attempt.

After every meaningful change:
1. Inspect the change.
2. Run relevant automated tests.
3. Run the production build.
4. Verify the actual behavior.
5. Check for regressions.
6. Deploy at meaningful release checkpoints.
7. Record a working Git checkpoint.

If a test or critical workflow fails, fix it before proceeding. Never claim that a test or deployment succeeded unless it was actually verified.

## 3. Frontend quality

Create a distinctive, premium hospitality experience—not a generic restaurant template.

Design direction:
- Warm, natural, editorial visual language.
- Thoughtful typography, composition, spacing, and responsive layouts.
- Authentic photographs of the actual venue.
- A coherent 3D or depth-based visual experience with purposeful animation.
- Smooth transitions, polished interaction states, and accessible controls.
- Excellent desktop and mobile experiences.

Use verified venue photographs from the official website or client-approved assets wherever possible. Never misrepresent stock or AI-generated imagery as real venue photography. If a real photograph is unavailable, use a clearly replaceable fallback.

The booking flow must remain usable even if 3D rendering fails. Respect reduced-motion preferences, optimize image loading, and avoid animations that obstruct the booking process.

Indoor/terrace selection must update both the displayed image and the reservation preference. Never imply that a particular table or seating location is guaranteed unless the actual reservation system supports it.

## 4. Initial MVP scope

### Customer website
- Premium landing page and signature visual experience.
- Reservation form with date, time, guest count, indoor/terrace preference, and contact details.
- Server-side validation.
- Persistent reservation storage.
- Clear success and error states.
- Spanish, Basque, and English support for the essential booking journey.

### Staff dashboard
- Secure staff authentication.
- View reservation requests.
- Enter phone reservations.
- Confirm, reject, and cancel reservations through validated state transitions.

### Business rules
- Keep operating hours, holidays, time intervals, and capacity configurable.
- Verify venue information against reliable sources.
- Do not hardcode uncertain operating rules.
- Do not invent available time slots.
- Treat indoor/terrace as a preference unless the actual seating model supports stronger guarantees.
- Prevent conflicting bookings using appropriate server-side and database protections.

### Excluded until explicitly approved
- AI chatbots or voice agents.
- Online payments.
- WhatsApp API integration.
- Complex floor plans.
- Loyalty programs, predictive analytics, and unrelated features.

## 5. Architecture

First inspect the existing project before choosing or changing its stack.

If starting from an empty repository, consider:
- React, TypeScript, and Vite.
- Tailwind CSS and accessible UI components.
- Supabase PostgreSQL for persistent data.
- Supabase Auth for staff authentication.
- Secure server-side database operations and access policies.
- Vitest and React Testing Library.
- Playwright for critical browser workflows.

Choose the smallest architecture that meets the actual requirements. Do not add unnecessary dependencies or replace existing working code without justification.

Separate presentation, domain rules, persistence, authentication, configuration, and tests. Use object-oriented design when useful, but do not introduce classes everywhere merely for the sake of OOP.

Never expose privileged credentials or service-role keys in frontend code.

## 6. Test-driven development

Use the following workflow where practical:

**RED:** Write a test that captures the expected behavior and verify that it fails for the intended reason.

**GREEN:** Implement the smallest change that makes the test pass.

**REFACTOR:** Improve the design and rerun the relevant tests.

Test reservation validation, invalid dates and times, capacity/conflict rules, state transitions, persistence, authorization, language switching, and the critical booking journey.

Distinguish between tests that passed, tests that were not run, mocked tests, and tests blocked by unavailable infrastructure.

## 7. Multi-model collaboration

Available models:
- Claude Opus 5.5
- Gemini 4 Argon
- GPT-5.6 Sol
- Claude Fable 5.1

Maintain one product specification, one agreed architecture, and one source of truth for domain types.

Assign one model ownership of each implementation task. Use other models for targeted design critique, code review, test planning, or debugging. Do not let multiple models independently build competing versions of the application.

Review changes and run tests instead of trusting model-generated claims.

## 8. Anti-scope-drift checklist

After each feature, verify:
- It satisfies the intended requirement.
- It stays within the agreed scope.
- It preserves existing working behavior.
- Its tests pass and the production build succeeds.
- No critical regression has been introduced.
- Its actual user-facing behavior has been checked.
- Deployment is verified at the appropriate checkpoint.
- Unnecessary changes are removed rather than retained.

If time is limited, reduce optional scope—not security, testing, or the quality of the essential booking journey.

## 9. Definition of done

A feature is complete only when its acceptance criteria are met, relevant tests pass, the production build succeeds, the actual behavior is verified, and no known critical regression remains.

A screenshot is not proof that functionality works. A form without persistent storage is not a complete reservation flow. A successful local build does not prove that a deployed application works.

## 10. Immediate instruction

Start by inspecting the project and reporting the current state. Do not assume a framework or database has already been configured.

Proceed in small, understandable steps. Explain what each major change accomplishes. Do not implement unrelated features or finalize a long-term roadmap prematurely.

The immediate goal is a visually exceptional, testable, deployable first baseline, followed by controlled, individually verified feature additions.