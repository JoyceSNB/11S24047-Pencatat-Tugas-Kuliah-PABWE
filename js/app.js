/* Modul 4: KONTROLER
   Menghubungkan validasi, data, dan tampilan lewat event handler. */
(function () {
  'use strict';

  const { validateTask, getTodayISO } = window.PT.validation;
  const { createStore } = window.PT.store;
  const { createView } = window.PT.view;

  function safeStorage() {
    try { return window.localStorage; }
    catch (e) { return { getItem: () => null, setItem: () => {} }; } // diblokir: pakai memori saja
  }

  function init() {
    const store = createStore(safeStorage());
    const view = createView(document.getElementById('app'));

    store.load();
    view.setMinDate(getTodayISO());   // bantuan UI; validasi sebenarnya tetap di JS
    view.render(store.getAll());

    view.form.addEventListener('submit', event => {
      event.preventDefault();
      const result = validateTask(view.readForm());
      view.showErrors(result.errors);
      if (!result.valid) return;

      store.add(result.values);
      view.render(store.getAll());
      view.resetForm(getTodayISO());
      view.announce(`Tugas "${result.values.title}" ditambahkan.`);
      view.focusTitle();
    });

    view.listEl.addEventListener('change', event => {
      if (event.target.type !== 'checkbox') return;
      const id = event.target.closest('li').dataset.id;
      store.toggle(id);
      view.render(store.getAll());
      view.focusCheckbox(id);         // urutan berubah: kembalikan fokus
    });

    view.listEl.addEventListener('click', event => {
      const btn = event.target.closest('.btn-delete');
      if (!btn) return;
      const li = btn.closest('li');
      const id = li.dataset.id;
      const index = [...view.listEl.children].indexOf(li);
      const task = store.find(id);

      store.remove(id);
      view.render(store.getAll());
      view.announce(`Tugas "${task.title}" dihapus.`);
      view.focusItemNear(index);      // pengguna keyboard tidak kehilangan posisi
    });
  }

  init();
})();
