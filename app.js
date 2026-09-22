const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const categories = ['เรียน', 'งาน', 'ส่วนตัว'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let tasks = [
  { id: 1, text: 'ทบทวนการสร้าง REST API', category: 'เรียน', done: true },
  { id: 2, text: 'เขียนรายงาน Mini Project', category: 'งาน', done: false },
  { id: 3, text: 'ทดสอบ API ผ่านหน้าเว็บ', category: 'เรียน', done: false },
];
let nextId = 4;

function findTask(id) {
  return tasks.find((task) => task.id === Number(id));
}

function validateTaskInput(body, partial = false) {
  const errors = [];
  if (!partial || Object.hasOwn(body, 'text')) {
    if (typeof body.text !== 'string' || !body.text.trim()) errors.push('กรุณาระบุชื่องาน');
    else if (body.text.trim().length > 120) errors.push('ชื่องานต้องไม่เกิน 120 ตัวอักษร');
  }
  if (Object.hasOwn(body, 'category') && !categories.includes(body.category)) errors.push('หมวดหมู่ไม่ถูกต้อง');
  if (Object.hasOwn(body, 'done') && typeof body.done !== 'boolean') errors.push('done ต้องเป็น true หรือ false');
  return errors;
}

app.get('/api/tasks', (req, res) => {
  const { done, category } = req.query;
  if (done !== undefined && !['true', 'false'].includes(done)) return res.status(400).json({ error: 'done ต้องเป็น true หรือ false' });
  if (category !== undefined && !categories.includes(category)) return res.status(400).json({ error: 'ไม่พบหมวดหมู่นี้' });
  let result = [...tasks];
  if (done !== undefined) result = result.filter((task) => String(task.done) === done);
  if (category !== undefined) result = result.filter((task) => task.category === category);
  return res.json(result);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
  return res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const errors = validateTaskInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const task = { id: nextId++, text: req.body.text.trim(), category: req.body.category || 'ส่วนตัว', done: false };
  tasks.push(task);
  return res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
  if (!Object.keys(req.body).some((key) => ['text', 'category', 'done'].includes(key))) return res.status(400).json({ error: 'กรุณาระบุข้อมูลที่ต้องการแก้ไข' });
  const errors = validateTaskInput(req.body, true);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  if (Object.hasOwn(req.body, 'text')) task.text = req.body.text.trim();
  if (Object.hasOwn(req.body, 'category')) task.category = req.body.category;
  if (Object.hasOwn(req.body, 'done')) task.done = req.body.done;
  return res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex((task) => task.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
  tasks.splice(index, 1);
  return res.status(204).end();
});

app.use('/api', (req, res) => res.status(404).json({ error: 'ไม่พบ API ที่เรียก' }));
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

if (require.main === module) app.listen(PORT, () => console.log(`Mini Project: http://localhost:${PORT}`));

module.exports = app;
