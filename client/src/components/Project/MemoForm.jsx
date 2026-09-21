import { useState } from 'react';
import { inputClass } from '../../utils/styles';
import { Button, Field } from '../common';
export default function MemoForm({ onSubmit }) {
  const [values, setValues] = useState({
    last_work: '',
    blocker: '',
    next_work: '',
    open_files: '',
    reference: '',
  });
  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...values,
      open_files: values.open_files
        .split(',')
        .map((file) => file.trim())
        .filter(Boolean),
    });
    setValues({ last_work: '', blocker: '', next_work: '', open_files: '', reference: '' });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="마지막 작업">
        <input
          name="last_work"
          required
          className={inputClass}
          value={values.last_work}
          onChange={(event) => setValues({ ...values, last_work: event.target.value })}
        />
      </Field>
      <Field label="막힌 부분">
        <input
          className={inputClass}
          value={values.blocker}
          onChange={(event) => setValues({ ...values, blocker: event.target.value })}
        />
      </Field>
      <Field label="다음 작업">
        <input
          className={inputClass}
          value={values.next_work}
          onChange={(event) => setValues({ ...values, next_work: event.target.value })}
        />
      </Field>
      <Field label="열어둘 파일 (쉼표로 구분)">
        <input
          className={inputClass}
          value={values.open_files}
          onChange={(event) => setValues({ ...values, open_files: event.target.value })}
        />
      </Field>
      <Field label="참고 자료">
        <input
          className={inputClass}
          value={values.reference}
          onChange={(event) => setValues({ ...values, reference: event.target.value })}
        />
      </Field>
      <Button>메모 저장</Button>
    </form>
  );
}
