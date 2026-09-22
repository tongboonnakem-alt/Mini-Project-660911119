const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const categoryInput = document.querySelector('#category-input');
const list = document.querySelector('#task-list');
const loading = document.querySelector('#loading');
const empty = document.querySelector('#empty');
const apiError = document.querySelector('#api-error');
const formError = document.querySelector('#form-error');
const count = document.querySelector('#task-count');
const filters = [...document.querySelectorAll('[data-filter]')];
const editDialog = document.querySelector('#edit-dialog');
const editForm = document.querySelector('#edit-form');
let currentFilter = 'all';

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

function createButton(label, className, handler) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = className; button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function render(tasks) {
  list.replaceChildren(); count.textContent = `${tasks.length} รายการ`; empty.hidden = tasks.length !== 0;
  tasks.forEach((task) => {
    const item = document.createElement('li'); item.className = `task-item${task.done ? ' done' : ''}`;
    const toggle = createButton(task.done ? '✓' : '', 'toggle', () => updateTask(task.id, { done: !task.done }));
    toggle.setAttribute('aria-label', `เปลี่ยนสถานะ ${task.text}`);
    const detail = document.createElement('div'); detail.className = 'task-detail';
    const title = document.createElement('strong'); title.textContent = task.text;
    const category = document.createElement('span'); category.className = 'category'; category.textContent = task.category;
    detail.append(title, category);
    const actions = document.createElement('div'); actions.className = 'task-actions';
    actions.append(createButton('แก้ไข', 'edit', () => openEdit(task)), createButton('ลบ', 'delete', () => deleteTask(task.id)));
    item.append(toggle, detail, actions); list.appendChild(item);
  });
}

async function loadTasks() {
  loading.hidden = false; apiError.hidden = true; empty.hidden = true;
  try {
    const query = currentFilter === 'all' ? '' : `?done=${currentFilter}`;
    render(await api(`/api/tasks${query}`));
  } catch (error) {
    list.replaceChildren(); count.textContent = '0 รายการ'; apiError.textContent = `โหลดข้อมูลไม่สำเร็จ: ${error.message}`; apiError.hidden = false;
  } finally { loading.hidden = true; }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); formError.textContent = '';
  const text = input.value.trim();
  if (!text) { formError.textContent = 'กรุณากรอกชื่องานก่อนเพิ่มรายการ'; input.focus(); return; }
  try {
    await api('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, category: categoryInput.value }) });
    form.reset(); input.focus(); await loadTasks();
  } catch (error) { formError.textContent = `เพิ่มรายการไม่สำเร็จ: ${error.message}`; }
});

async function updateTask(id, changes) {
  try {
    await api(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
    await loadTasks();
  } catch (error) { apiError.textContent = `แก้ไขรายการไม่สำเร็จ: ${error.message}`; apiError.hidden = false; }
}

function openEdit(task) {
  document.querySelector('#edit-id').value = task.id; document.querySelector('#edit-text').value = task.text;
  document.querySelector('#edit-category').value = task.category; document.querySelector('#edit-error').textContent = ''; editDialog.showModal();
}

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#edit-id').value; const text = document.querySelector('#edit-text').value.trim();
  if (!text) { document.querySelector('#edit-error').textContent = 'กรุณากรอกชื่องาน'; return; }
  await updateTask(id, { text, category: document.querySelector('#edit-category').value }); editDialog.close();
});

document.querySelector('#cancel-edit').addEventListener('click', () => editDialog.close());
document.querySelector('#refresh-button').addEventListener('click', loadTasks);

async function deleteTask(id) {
  try { await api(`/api/tasks/${id}`, { method: 'DELETE' }); await loadTasks(); }
  catch (error) { apiError.textContent = `ลบรายการไม่สำเร็จ: ${error.message}`; apiError.hidden = false; }
}

filters.forEach((button) => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter; filters.forEach((item) => item.classList.toggle('active', item === button)); loadTasks();
}));

loadTasks();
