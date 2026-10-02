"use strict";

function buildWhatsAppUrl(phone, company, fields) {
  const lines = [
    `Olá! Gostaria de falar com ${company}.`,
    "",
    ...fields
      .filter(([, value]) => String(value).trim())
      .map(([label, value]) => `${label}: ${String(value).trim()}`),
  ];
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

if (typeof module !== "undefined") module.exports = { buildWhatsAppUrl };

if (typeof document !== "undefined") {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  const form = document.querySelector("[data-budget]");
  if (form) {
    const controls = [...form.querySelectorAll("input, select")];
    function validate(control) {
      let message = "";
      const value = control.value.trim();
      if (control.required && !value) message = "Preencha este campo para continuar.";
      else if (control.type === "tel" && !/^\(?[1-9]\d\)?[\s.-]?9?\d{4}[\s.-]?\d{4}$/.test(value)) {
        message = "Informe o DDD e o telefone, por exemplo: (11) 99999-9999.";
      }
      control.setCustomValidity(message);
      return !message;
    }
    controls.forEach((control) => {
      control.addEventListener("input", () => validate(control));
      control.addEventListener("change", () => validate(control));
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      controls.forEach(validate);
      if (!form.reportValidity()) return;
      const fields = controls
        .filter((control) => !control.disabled)
        .map((control) => [control.dataset.label, control.value]);
      const url = buildWhatsAppUrl(form.dataset.phone, form.dataset.company, fields);
      const status = document.querySelector("[data-form-status]");
      const fallback = status.querySelector("a");
      fallback.href = url;
      status.hidden = false;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
}
