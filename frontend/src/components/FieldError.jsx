const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null;

export default FieldError;
