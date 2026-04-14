import DatePicker, { type ReactDatePickerProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type ERPDatePickerProps = ReactDatePickerProps;

export default function ERPDatePicker({
  dateFormat = "dd-MMM-yyyy",
  className = "inputtextbox w-full",
  wrapperClassName = "w-full",
  popperClassName = "z-50",
  showMonthDropdown = true,
  showYearDropdown = true,
  dropdownMode = "select",
  scrollableYearDropdown = true,
  yearDropdownItemNumber = 100,
  ...props
}: ERPDatePickerProps) {
  return (
    <DatePicker
      dateFormat={dateFormat}
      className={className}
      wrapperClassName={wrapperClassName}
      popperClassName={popperClassName}
      showMonthDropdown={showMonthDropdown}
      showYearDropdown={showYearDropdown}
      dropdownMode={dropdownMode}
      scrollableYearDropdown={scrollableYearDropdown}
      yearDropdownItemNumber={yearDropdownItemNumber}
      {...props}
    />
  );
}
