/* Matrukrupa Enterprise - progressive enhancement only.
   The site is fully usable with this file absent: nav links are real <a>s,
   the FAQ uses native <details>, and the contact form is a real mailto form. */
(function () {
  "use strict";

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---- Reveal on scroll (fail-safe: only hides if JS runs) ---- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length && !reduce && "IntersectionObserver" in window) {
    reveals.forEach(function (el) {
      el.classList.add("reveal--armed");
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- Contact form: compose a mailto: draft (no backend) ---- */
  var form = document.querySelector("form[data-mailto]");
  if (form) {
    form.addEventListener("submit", function (e) {
      var to = form.getAttribute("data-mailto");
      if (!to) return; // fall back to native action
      e.preventDefault();
      var get = function (name) {
        var f = form.elements[name];
        return f ? String(f.value || "").trim() : "";
      };
      var name = get("name");
      var email = get("email");
      var brand = get("brand");
      var retail = get("retail");
      var outlets = get("outlets");
      var message = get("message");

      var subject = "Project enquiry" + (brand ? " - " + brand : "") +
        (name ? " (" + name + ")" : "");

      var lines = [];
      if (name) lines.push("Name: " + name);
      if (email) lines.push("Email: " + email);
      if (brand) lines.push("Brand / company: " + brand);
      if (retail) lines.push("Type of retail: " + retail);
      if (outlets) lines.push("Current outlets: " + outlets);
      lines.push("");
      lines.push(message || "");

      var href =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));

      window.location.href = href;

      var status = form.querySelector("[data-status]");
      if (status) {
        status.hidden = false;
        status.textContent =
          "Opening your email app with the message ready to send. If nothing happens, email " +
          to + " directly.";
      }
    });
  }

  /* ---- Footer year ---- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
})();
