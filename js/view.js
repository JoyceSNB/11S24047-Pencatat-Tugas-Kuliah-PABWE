/* Modul 3: TAMPILAN
   Seluruh antarmuka dibangun dari JavaScript (document.createElement).
   Teks pengguna selalu lewat textContent, jadi aman dari injeksi HTML. */
(function (root) {
  'use strict';

  const V = root.PT.validation;
  const S = root.PT.store;

  // Pembantu pembuat elemen: h('p', { class: 'x', id: 'y' }, 'teks' atau elemen lain)
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === false || value == null) continue;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key === 'checked' || key === 'hidden') el[key] = value;
      else el.setAttribute(key, value === true ? '' : value);
    }
    el.append(...children);
    return el;
  }

  const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' });

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return dateFormatter.format(new Date(y, m - 1, d));
  }

  /* ---------- Kerangka halaman ---------- */
  function buildForm() {
    const select = h('select', { id: 'course', name: 'course',
      'aria-describedby': 'course-error', 'aria-required': 'true' },
      h('option', { value: '', text: 'Pilih mata kuliah' }));
    V.COURSES.forEach(name => select.append(h('option', { value: name, text: name })));

    return h('form', { id: 'task-form', novalidate: true },
      h('div', { class: 'grid' },
        h('div', { class: 'field-wide' },
          h('label', { for: 'title', text: 'Judul tugas' }),
          h('p', { class: 'hint', id: 'title-hint', text: `Minimal ${V.TITLE_MIN} karakter.` }),
          h('input', { type: 'text', id: 'title', name: 'title', maxlength: V.TITLE_MAX,
            autocomplete: 'off', 'aria-describedby': 'title-hint title-error', 'aria-required': 'true' }),
          h('p', { class: 'error', id: 'title-error' })),
        h('div', {},
          h('label', { for: 'course', text: 'Mata kuliah' }),
          select,
          h('p', { class: 'error', id: 'course-error' })),
        h('div', {},
          h('label', { for: 'deadline', text: 'Deadline' }),
          h('input', { type: 'date', id: 'deadline', name: 'deadline',
            'aria-describedby': 'deadline-error', 'aria-required': 'true' }),
          h('p', { class: 'error', id: 'deadline-error' }))),
      h('div', { class: 'actions' },
        h('button', { type: 'submit', text: 'Tambah tugas' })));
  }

  function buildSummary() {
    const box = (label, id) => h('div', {}, h('dt', { text: label }), h('dd', { id, text: '0' }));
    // role="status" = aria-live polite: perubahan angka dibacakan pembaca layar
    return h('dl', { class: 'summary', id: 'summary', role: 'status' },
      box('Total', 'sum-total'), box('Belum selesai', 'sum-open'), box('Selesai', 'sum-done'));
  }

  function section(titleId, title, ...content) {
    return h('section', { 'aria-labelledby': titleId }, h('h2', { id: titleId, text: title }), ...content);
  }

  function buildTaskItem(task) {
    const checkbox = h('input', { type: 'checkbox', id: 'chk-' + task.id, checked: task.done });
    const del = h('button', { type: 'button', class: 'btn-delete', text: 'Hapus',
      'aria-label': `Hapus tugas ${task.title}` });
    return h('li', { class: 'task' + (task.done ? ' is-done' : ''), 'data-id': task.id },
      checkbox,
      h('div', { class: 'task-body' },
        h('label', { for: checkbox.id, text: task.title }),
        h('p', { class: 'task-meta', text: `${task.course} · Deadline ${formatDate(task.deadline)}` })),
      del);
  }

  /* ---------- API tampilan ---------- */
  function createView(mountEl) {
    mountEl.replaceChildren(h('main', {},
      h('h1', { text: 'Catatan Tugas Kuliah' }),
      section('judul-form', 'Tambah tugas', buildForm()),
      section('judul-ringkasan', 'Ringkasan', buildSummary()),
      section('judul-daftar', 'Daftar tugas',
        h('ul', { class: 'task-list', id: 'task-list' }),
        h('p', { class: 'empty', id: 'empty-state', text: 'Belum ada tugas. Isi form di atas untuk menambahkan.' }),
        h('p', { class: 'status', id: 'status', role: 'status' }))));

    const $ = id => document.getElementById(id);
    const fields = { title: $('title'), course: $('course'), deadline: $('deadline') };
    const errorBoxes = { title: $('title-error'), course: $('course-error'), deadline: $('deadline-error') };
    const listEl = $('task-list');

    return {
      form: $('task-form'),
      listEl,

      readForm() {
        return { title: fields.title.value, course: fields.course.value, deadline: fields.deadline.value };
      },

      resetForm(todayISO) {
        $('task-form').reset();
        fields.deadline.min = todayISO;
      },

      setMinDate(todayISO) { fields.deadline.min = todayISO; },

      showErrors(errors) {
        Object.keys(fields).forEach(key => {
          errorBoxes[key].textContent = errors[key];
          if (errors[key]) fields[key].setAttribute('aria-invalid', 'true');
          else fields[key].removeAttribute('aria-invalid');
        });
        const firstInvalid = Object.keys(fields).find(k => errors[k]);
        if (firstInvalid) fields[firstInvalid].focus();
      },

      announce(message) {
        const el = $('status');
        el.textContent = '';
        // jeda singkat agar pembaca layar mendeteksi perubahan teks
        setTimeout(() => { el.textContent = message; }, 50);
      },

      render(tasks) {
        listEl.replaceChildren(...S.sortTasks(tasks).map(buildTaskItem));
        $('empty-state').hidden = tasks.length > 0;
        const s = S.computeSummary(tasks);
        $('sum-total').textContent = s.total;
        $('sum-open').textContent = s.open;
        $('sum-done').textContent = s.done;
      },

      focusCheckbox(id) {
        const el = $('chk-' + id);
        if (el) el.focus();
      },

      focusItemNear(index) {
        const items = listEl.children;
        if (items.length) items[Math.min(index, items.length - 1)].querySelector('input').focus();
        else fields.title.focus();
      },

      focusTitle() { fields.title.focus(); }
    };
  }

  const api = { h, formatDate, createView };
  root.PT.view = api;
})(window);
