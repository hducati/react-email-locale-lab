# Domain Context

## Terms

### Locale Lab

A local-first quality gate for multilingual React Email templates. It exposes structural and visual localization risks before templates are published or tested in production-like email clients.

### Visual localization risk

A layout or presentation defect revealed by rendering representative copy in another locale, such as text overflow, unexpected wrapping, clipped content, broken proportions, or incorrect text direction. It does not include judging linguistic correctness.

### QA handoff artifact

A static, shareable result generated locally or in CI so QA can review multilingual template previews without cloning the repository, running the development environment, or accessing a hosted Locale Lab account.

### Translation fixture

Machine-translated copy used as stress-test data for visual inspection. It is not an approved translation and does not replace the application's localization workflow.

### Comparison set

The source locale plus up to three simultaneously selected translation fixtures. Product language should describe this as “compare the original with up to three translations,” not ambiguously as “four languages.”

### Risk finding

An automatically detected indication that a multilingual rendering may contain a visual localization defect. A finding directs human attention; it is not a test failure and does not block the development workflow.

### Analysis session

The developer workflow of selecting a template, choosing a comparison set, inspecting rendered previews, and reviewing risk findings while editing locally.

### Stress preview

An analysis mode that generates translation fixtures automatically to expose likely visual localization risks before official localized content is available.

### Locale validation

An analysis mode that renders the consuming application's official localized content so developers and QA can inspect what is intended to ship. Unlike a stress preview, it evaluates production-bound copy but still does not certify linguistic correctness.

### Locale content adapter

A consumer-provided integration that supplies production-bound template content or props for a requested locale. Locale Lab does not own, discover, or prescribe the consuming application's localization system.

### Template scenario

A named set of representative input data for one email template, such as minimal content, long content, many items, or optional fields. A scenario is independent of locale: an analysis case is the combination of a template, a template scenario, and a locale.

### Render-observable risk

A risk finding derived from the rendered document available to Locale Lab, such as overflow, clipping, overlap, anomalous dimensions, broken directionality, or unavailable assets. It does not claim compatibility with the rendering engines of Gmail, Outlook, or other email clients.

### Convention path

The default integration path in which Locale Lab owns its development host, discovers templates from a documented email directory, reuses `PreviewProps`, and requires only locale policy plus explicit exceptions. Advanced consumers may instead use the lower-level embedding API.
