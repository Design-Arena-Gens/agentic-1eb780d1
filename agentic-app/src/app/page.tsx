"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import styles from "./page.module.css";

type RequestStatus = "idle" | "submitting" | "complete" | "error";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("veo-3.1-generate-preview");
  const [referenceImages, setReferenceImages] = useState<FileList | null>(null);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);

  const referenceImageCount = useMemo(
    () => (referenceImages ? referenceImages.length : 0),
    [referenceImages],
  );

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
      setReferenceImages(event.target.files);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("submitting");
      setError(null);
      setResponse(null);

      if (referenceImages && referenceImages.length > 2) {
        setStatus("error");
        setError("Please select no more than two reference images.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("model", model);

        if (referenceImages) {
          Array.from(referenceImages).forEach((file) => {
            formData.append("reference_images", file);
          });
        }

        const res = await fetch("/api/generate-video", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Request failed");
        }

        const payload = await res.json();
        setResponse(payload);
        setStatus("complete");
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Unexpected error occurred",
        );
      }
    },
    [model, prompt, referenceImages],
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Veo Video Generator</h1>
          <p>
            Send prompts and reference images to Google&lsquo;s Veo model and
            inspect the raw response. Provide two optional guiding frames to
            steer motion and composition.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Prompt
            <textarea
              required
              className={styles.textarea}
              value={prompt}
              placeholder="Describe the scene you want Veo to render..."
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>

          <label className={styles.label}>
            Model
            <select
              className={styles.select}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              <option value="veo-3.1-generate-preview">
                veo-3.1-generate-preview
              </option>
              <option value="veo-3.2">veo-3.2</option>
            </select>
          </label>

          <label className={styles.label}>
            Reference Images (optional, max 2)
            <input
              className={styles.fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleFileChange}
            />
            <span className={styles.helpText}>
              Selected: {referenceImageCount}/2
            </span>
          </label>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Generating…" : "Generate Video"}
          </button>
        </form>

        <section className={styles.results}>
          <h2>Response</h2>
          {status === "idle" && (
            <p className={styles.placeholder}>
              Submit the form to see the Veo API response here.
            </p>
          )}
          {status === "submitting" && (
            <p className={styles.placeholder}>
              Request dispatched. Waiting for Veo…
            </p>
          )}
          {status === "error" && (
            <p className={styles.error}>{error ?? "Unknown error"}</p>
          )}
          {status === "complete" && (
            <pre className={styles.response}>
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </section>
      </main>
    </div>
  );
}
