const WHATSAPP_NUMBER = "";
const header = document.querySelector("#site-header");
let lastScrollY = window.scrollY;

const syncHeaderVisibility = () => {
  if (!header) return;

  const currentScrollY = window.scrollY;
  const shouldHide = currentScrollY > lastScrollY && currentScrollY > 90;
  header.classList.toggle("is-hidden", shouldHide);
  lastScrollY = currentScrollY;
};

window.addEventListener("scroll", syncHeaderVisibility, { passive: true });

const buildMessage = (form, type) => {
  const data = new FormData(form);
  const lines = [`Hola Bisonte CrossFit, quiero consultar por ${type}.`];

  for (const [key, value] of data.entries()) {
    const cleanValue = String(value).trim();
    if (!cleanValue) continue;
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    lines.push(`${label}: ${cleanValue}`);
  }

  return lines.join("\n");
};

document.querySelectorAll("form[data-form-type]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const status = form.querySelector(".form-status");
    const type = form.dataset.formType === "horario" ? "horarios" : "planes y contacto";
    const message = encodeURIComponent(buildMessage(form, type));
    const target = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
      : `https://wa.me/?text=${message}`;

    status.textContent = "Abriendo WhatsApp con tu consulta.";
    window.open(target, "_blank", "noopener,noreferrer");
    form.reset();
  });
});
