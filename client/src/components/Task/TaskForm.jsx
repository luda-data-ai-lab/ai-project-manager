import { useState } from 'react';
import { inputClass } from '../../utils/styles';
import { Button } from '../common';
export default function TaskForm({ onSubmit }) {
  const [values, setValues] = useState({ title: '', description: '' });
  const submit = (event) => {
    event.preventDefault();
    if (!values.title.trim()) return;
    onSubmit(values);
    setValues({ title: '', description: '' });
  };
  return (
    <form onSubmit={submit} className="mb-5 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
      <input
        name="title"
        required
        placeholder="새 작업 제목"
        className={inputClass}
        value={values.title}
        onChange={(event) => setValues({ ...values, title: event.target.value })}
      />
      <textarea
        placeholder="설명 (선택)"
        className={inputClass}
        value={values.description}
        onChange={(event) => setValues({ ...values, description: event.target.value })}
      />
      <Button>작업 추가</Button>
    </form>
  );
}
