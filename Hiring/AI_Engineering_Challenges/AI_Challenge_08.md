# AI Challenge 08 — Medical Document Extractor

## Note

- You are expected to use AI coding tools (e.g., Claude Code, Cursor, GitHub Copilot) to complete this challenge.
- We evaluate your ability to decompose the problem, direct the AI tool effectively, and deliver a working solution.
- Please estimate and give us your timeline.
- If you have any issues, don't hesitate to contact us.

## Difficulty

Advanced · 4–6 hours

## Context

Claims processing requires extracting structured data from medical documents — hospital bills, discharge summaries, receipts. Manual data entry is slow and error-prone. Automating extraction with AI/LLM vision capabilities dramatically speeds up claims processing.

## Problem

Build a document extraction pipeline that takes a medical document (PDF or image) and returns structured JSON with extracted fields and confidence scores.

## Setup

- Use any LLM with vision capabilities (Claude, GPT-4o, Gemini). Use your own API key or a free tier.
- Create or source 10 sample medical documents. You may generate mock documents (create realistic-looking HTML → PDF) if you cannot find real ones. The documents should include a mix of:
  - Hospital invoices/receipts (3)
  - Discharge summaries (3)
  - Lab reports (2)
  - Prescriptions (2)

## Requirements

### Document Classification
- Automatically classify each document into one of: receipt, discharge_summary, lab_report, prescription
- Return the classification with a confidence score

### Field Extraction Per Document Type

**Receipt:**
- hospital_name, patient_name, date, items (list of {description, quantity, unit_price, total}), grand_total, payment_method

**Discharge Summary:**
- hospital_name, patient_name, admission_date, discharge_date, diagnosis (primary + secondary), procedures_performed, attending_physician, discharge_instructions

**Lab Report:**
- lab_name, patient_name, date, tests (list of {test_name, result, unit, reference_range, flag: normal/high/low})

**Prescription:**
- doctor_name, patient_name, date, medications (list of {name, dosage, frequency, duration, quantity})

### Output Format
```json
{
  "document_type": "receipt",
  "confidence": 0.95,
  "fields": {
    "hospital_name": { "value": "Bangkok Hospital", "confidence": 0.98 },
    "patient_name": { "value": "John Doe", "confidence": 0.92 },
    "grand_total": { "value": 15750.00, "confidence": 0.97 }
  },
  "validation_errors": []
}
```

### Validation
- Dates must be valid dates
- Amounts must be positive numbers
- Item totals should sum to the grand total (flag if mismatch > 5%)
- Confidence score per field (0.0–1.0)

## Evaluation Criteria

- Correct classification for all 10 documents
- Extraction accuracy — fields match the actual document content
- Confidence scores are meaningful (low confidence on uncertain fields, not uniformly high)
- Validation catches real issues (date format, amount mismatches)
- No hallucinated data — if a field is not visible in the document, it should be null with low confidence, not fabricated
- Pipeline is reusable — works with any document following these types, not hardcoded to test data

## Submission

- Push your project onto a GitHub repository
- Include the 10 test documents and their extraction results
- Include a brief writeup of your prompt engineering approach
