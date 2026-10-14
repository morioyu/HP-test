/* ==========================================================================
   長崎県病院協議会 公式サイト スクリプト
   ========================================================================== */
(function () {
  "use strict";

  var NEW_DAYS = 14;

  /* ---------- Utilities ---------- */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    return iso.replace(/-/g, ".");
  }

  function isNew(iso) {
    var diff = (Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000;
    return diff >= 0 && diff < NEW_DAYS;
  }

  /* ---------- Header / Navigation ---------- */
  function initHeader() {
    var header = $(".site-header");
    var toggle = $(".menu-toggle");
    var nav = $(".global-nav");
    var pageTop = $(".page-top");

    function onScroll() {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 10);
      if (pageTop) pageTop.classList.toggle("is-visible", y > 400);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle && nav) {
      function setMenu(open) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
        nav.classList.toggle("is-open", open);
        document.body.classList.toggle("is-menu-open", open);
      }

      toggle.addEventListener("click", function () {
        setMenu(toggle.getAttribute("aria-expanded") !== "true");
      });

      $all("a", nav).forEach(function (link) {
        link.addEventListener("click", function () {
          setMenu(false);
        });
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("is-open")) {
          setMenu(false);
          toggle.focus();
        }
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 960) setMenu(false);
      });
    }

    if (pageTop) {
      pageTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    var year = $("#copyright-year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var targets = $all(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Count-up numbers ---------- */
  function initCounters() {
    var counters = $all("[data-count]");
    if (!counters.length) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (reduced) {
        el.textContent = target.toLocaleString();
        return;
      }
      var start = null;
      var duration = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- News ---------- */
  function newsItemHtml(item) {
    var label = window.NEWS_CATEGORIES[item.category] || "";
    return (
      '<li class="news-item">' +
        '<a href="news.html#news-' + item.id + '" data-news-id="' + item.id + '">' +
          '<time class="news-date" datetime="' + item.date + '">' + formatDate(item.date) + "</time>" +
          '<span class="news-tag" data-category="' + item.category + '">' + escapeHtml(label) + "</span>" +
          '<span class="news-title">' + escapeHtml(item.title) +
            (isNew(item.date) ? '<span class="news-new">NEW</span>' : "") +
          "</span>" +
        "</a>" +
      "</li>"
    );
  }

  function initTopNews() {
    var list = $("#top-news-list");
    if (!list || !window.NEWS_DATA) return;
    list.innerHTML = window.NEWS_DATA.slice(0, 5).map(newsItemHtml).join("");
  }

  function initNewsPage() {
    var list = $("#news-list");
    if (!list || !window.NEWS_DATA) return;

    var PER_PAGE = 8;
    var filterWrap = $(".news-filter");
    var pagination = $(".pagination");
    var empty = $(".news-empty");
    var state = { category: "all", page: 1 };

    function filtered() {
      return window.NEWS_DATA.filter(function (item) {
        return state.category === "all" || item.category === state.category;
      });
    }

    function renderPagination(total) {
      var pages = Math.ceil(total / PER_PAGE);
      if (pages <= 1) {
        pagination.innerHTML = "";
        return;
      }
      var html = '<button type="button" data-page="prev" aria-label="前のページ"' +
        (state.page === 1 ? " disabled" : "") + ">‹</button>";
      for (var i = 1; i <= pages; i++) {
        html += '<button type="button" data-page="' + i + '"' +
          (i === state.page ? ' aria-current="page"' : "") + ">" + i + "</button>";
      }
      html += '<button type="button" data-page="next" aria-label="次のページ"' +
        (state.page === pages ? " disabled" : "") + ">›</button>";
      pagination.innerHTML = html;
    }

    function render() {
      var items = filtered();
      var start = (state.page - 1) * PER_PAGE;
      list.innerHTML = items.slice(start, start + PER_PAGE).map(newsItemHtml).join("");
      empty.hidden = items.length > 0;
      renderPagination(items.length);
    }

    filterWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      $all(".filter-btn", filterWrap).forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      state.category = btn.getAttribute("data-filter");
      state.page = 1;
      render();
    });

    pagination.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || btn.disabled) return;
      var val = btn.getAttribute("data-page");
      if (val === "prev") state.page -= 1;
      else if (val === "next") state.page += 1;
      else state.page = parseInt(val, 10);
      render();
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* Detail modal */
    var modal = $("#news-modal");
    var lastFocus = null;

    function openModal(id) {
      var item = window.NEWS_DATA.filter(function (n) { return n.id === id; })[0];
      if (!item) return;
      lastFocus = document.activeElement;
      $(".modal-meta", modal).innerHTML =
        '<time class="news-date" datetime="' + item.date + '">' + formatDate(item.date) + "</time>" +
        '<span class="news-tag" data-category="' + item.category + '">' +
        escapeHtml(window.NEWS_CATEGORIES[item.category]) + "</span>";
      $("#news-modal-title").textContent = item.title;
      $(".modal-body", modal).innerHTML = item.body.map(function (p) {
        return "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>";
      }).join("");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $(".modal-close", modal).focus();
      history.replaceState(null, "", "#news-" + id);
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      history.replaceState(null, "", location.pathname + location.search);
      if (lastFocus) lastFocus.focus();
    }

    list.addEventListener("click", function (e) {
      var link = e.target.closest("[data-news-id]");
      if (!link) return;
      e.preventDefault();
      openModal(parseInt(link.getAttribute("data-news-id"), 10));
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest(".modal-close")) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") {
        // モーダル内にフォーカスを閉じ込める
        var focusables = $all("button, a[href]", modal);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    render();

    var match = location.hash.match(/^#news-(\d+)$/);
    if (match) openModal(parseInt(match[1], 10));
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;

    var MAX_MESSAGE = 1000;
    var panels = {
      input: $("#step-input"),
      confirm: $("#step-confirm"),
      complete: $("#step-complete")
    };
    var steps = $all(".steps li");
    var message = $("#message");
    var counter = $("#message-count");
    var agree = $("#agree");
    var submitBtn = $("#to-confirm");

    var rules = {
      category: function (v) { return v ? "" : "お問い合わせ種別を選択してください。"; },
      name: function (v) { return v.trim() ? "" : "お名前を入力してください。"; },
      kana: function (v) {
        if (!v.trim()) return "";
        return /^[ァ-ヶー\s　]+$/.test(v.trim()) ? "" : "フリガナは全角カタカナで入力してください。";
      },
      email: function (v) {
        if (!v.trim()) return "メールアドレスを入力してください。";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "メールアドレスの形式が正しくありません。";
      },
      email_confirm: function (v) {
        if (!v.trim()) return "確認用メールアドレスを入力してください。";
        return v.trim() === form.email.value.trim() ? "" : "メールアドレスが一致しません。";
      },
      tel: function (v) {
        if (!v.trim()) return "";
        return /^[0-9０-９\-－()（） ]{10,15}$/.test(v.trim()) ? "" : "電話番号の形式が正しくありません。";
      },
      message: function (v) {
        if (!v.trim()) return "お問い合わせ内容を入力してください。";
        return v.length <= MAX_MESSAGE ? "" : "お問い合わせ内容は" + MAX_MESSAGE + "文字以内で入力してください。";
      }
    };

    var labels = {
      category: "お問い合わせ種別",
      organization: "病院名・所属",
      name: "お名前",
      kana: "フリガナ",
      email: "メールアドレス",
      tel: "電話番号",
      message: "お問い合わせ内容"
    };

    function fieldValue(name) {
      var el = form.elements[name];
      return el ? el.value : "";
    }

    function validateField(name) {
      if (!rules[name]) return true;
      var error = rules[name](fieldValue(name));
      var errorEl = $("#error-" + name);
      var inputs = $all('[name="' + name + '"]', form);
      inputs.forEach(function (input) {
        input.classList.toggle("is-invalid", !!error);
        input.setAttribute("aria-invalid", String(!!error));
      });
      if (errorEl) errorEl.textContent = error;
      return !error;
    }

    function validateAll() {
      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        if (!validateField(name) && !firstInvalid) firstInvalid = name;
      });
      return firstInvalid;
    }

    function showStep(key) {
      var order = ["input", "confirm", "complete"];
      var idx = order.indexOf(key);
      Object.keys(panels).forEach(function (k) {
        panels[k].hidden = k !== key;
      });
      steps.forEach(function (li, i) {
        li.classList.toggle("is-current", i === idx);
        li.classList.toggle("is-done", i < idx);
        if (i === idx) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      });
      var top = $(".contact-main");
      if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Live validation
    Object.keys(rules).forEach(function (name) {
      $all('[name="' + name + '"]', form).forEach(function (input) {
        var evt = input.type === "radio" || input.tagName === "SELECT" ? "change" : "blur";
        input.addEventListener(evt, function () { validateField(name); });
        input.addEventListener("input", function () {
          if (input.classList.contains("is-invalid")) validateField(name);
        });
      });
    });

    form.email.addEventListener("input", function () {
      if (form.email_confirm.value) validateField("email_confirm");
    });

    function updateCount() {
      var len = message.value.length;
      counter.textContent = len + " / " + MAX_MESSAGE;
      counter.classList.toggle("is-over", len > MAX_MESSAGE);
    }
    message.addEventListener("input", updateCount);
    updateCount();

    function updateSubmit() {
      submitBtn.disabled = !agree.checked;
    }
    agree.addEventListener("change", updateSubmit);
    updateSubmit();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalid = validateAll();
      if (invalid) {
        var el = form.elements[invalid];
        var target = el && el.length && !el.tagName ? el[0] : el;
        if (target && target.focus) target.focus();
        return;
      }

      var rows = Object.keys(labels).map(function (name) {
        var value = fieldValue(name).trim();
        if (name === "category") {
          var checked = $('[name="category"]:checked', form);
          value = checked ? checked.parentNode.textContent.trim() : "";
        }
        return "<tr><th>" + labels[name] + "</th><td>" +
          (value ? escapeHtml(value) : '<span style="color:var(--color-text-sub)">（未入力）</span>') +
          "</td></tr>";
      });
      $("#confirm-body").innerHTML = rows.join("");
      showStep("confirm");
    });

    $("#back-to-input").addEventListener("click", function () {
      showStep("input");
    });

    $("#send").addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = "送信中…";

      // ※ 実運用時はここでサーバーへ送信してください（例：fetch("/api/contact", {...})）。
      setTimeout(function () {
        form.reset();
        updateCount();
        updateSubmit();
        btn.disabled = false;
        btn.textContent = "送信する";
        showStep("complete");
      }, 900);
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initReveal();
    initCounters();
    initTopNews();
    initNewsPage();
    initContactForm();
  });
})();
