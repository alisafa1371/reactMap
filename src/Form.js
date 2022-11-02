import { useRef } from "react";
import style from "./Form.module.css";
const Form = (props) => {
  const latInputRef = useRef();
  const longInputRef = useRef();
  const coordsHandler = () => {
    props.onChange(latInputRef.current.value, longInputRef.current.value);
  };
  return (
    <div className={style["coords-box"]}>
      <h1>Where to?</h1>
      <div className={style["form-row"]}>
        <label htmlFor="latitude">Latitude</label>
        <input
          id="latitude"
          type="text"
          placeholder="Put in latitude"
          onChange={coordsHandler}
          ref={latInputRef}
        />
      </div>
      <div className={style["form-row"]}>
        <label htmlFor="longitude">Longitude</label>
        <input
          id="longitude"
          type="text"
          placeholder="Put in longitude"
          onChange={coordsHandler}
          ref={longInputRef}
        />
      </div>
    </div>
  );
};
export default Form;
