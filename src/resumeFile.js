import mammoth from "mammoth";

// Reads a resume file, returns { resumeUrl, resumeText, note }.
// resumeUrl is a base64 data URI (so the file itself is downloadable later).
// resumeText is only populated for .docx, since there's no PDF text
// extraction available in the browser — PDFs are still stored and
// downloadable, just not searchable by content.
export async function readResumeFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const resumeUrl = `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}#filename=${encodeURIComponent(file.name)}`;

  if (file.name.toLowerCase().endsWith(".docx")) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { resumeUrl, resumeText: result.value || "", note: "Resume text extracted — searchable by content." };
    } catch (e) {
      return { resumeUrl, resumeText: "", note: "Uploaded, but couldn't extract text for search." };
    }
  }

  return { resumeUrl, resumeText: "", note: "Uploaded. This file type isn't searchable by content — add skill tags so this candidate still turns up in search." };
}

export function resumeFileName(resumeUrl) {
  if (!resumeUrl) return null;
  const match = resumeUrl.match(/#filename=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "resume";
}

export function resumeMimeType(resumeUrl) {
  if (!resumeUrl) return null;
  const match = resumeUrl.match(/^data:([^;]+);/);
  return match ? match[1] : null;
}

// Best-effort field extraction from resume text. This is a heuristic, not
// real parsing — no AI/NLP runs in the browser. It reliably finds email and
// phone via regex; the "name" guess is just the first non-empty line, which
// is right for most conventionally-formatted resumes but not guaranteed.
// Skills and address are NOT auto-extracted — too unreliable to guess at
// without a real parsing service, so those stay blank for the recruiter to
// fill in during review.
export function extractFieldsFromText(text) {
  if (!text) return { name: "", email: "", phone: "" };

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\-.\s()]{8,}\d)/);

  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 1 && l.length < 60 && !l.includes("@") && !/\d{3,}/.test(l));

  return {
    name: firstLine || "",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0].trim() : "",
  };
}
