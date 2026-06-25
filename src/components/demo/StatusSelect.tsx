type StatusSelectProps<TStatus extends string> = {
  label: string;
  value: TStatus;
  options: readonly TStatus[];
  onChange: (status: TStatus) => void;
};

export default function StatusSelect<TStatus extends string>({
  label,
  value,
  options,
  onChange,
}: StatusSelectProps<TStatus>) {
  function handleChange(selectedValue: string) {
    const selectedStatus = options.find(
      (option) => option === selectedValue,
    );

    if (selectedStatus !== undefined) {
      onChange(selectedStatus);
    }
  }

  return (
    <div className="mt-5">
      <label className="text-sm font-medium text-slate-300">
        <span>{label}</span>
        <select
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
