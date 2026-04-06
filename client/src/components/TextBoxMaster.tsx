import { useState, forwardRef, useImperativeHandle } from "react";
import { Search } from "lucide-react";

type TextBoxMasterProps = {
  label: string;
  searchType: string;
  onFindClick?: (searchType: string) => void;
  disabled?: boolean;
};

export type TextBoxMasterRef = {
  getCode: () => string;
  getDescription: () => string;
  setValue: (code: string, description?: string) => void;
  clear: () => void;
};

const TextBoxMaster = forwardRef<TextBoxMasterRef, TextBoxMasterProps>(
  ({ label, searchType, onFindClick, disabled = false }, ref) => {
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");

    useImperativeHandle(
      ref,
      () => ({
        getCode: () => code,
        getDescription: () => description,
        setValue: (newCode: string, newDescription = "") => {
          setCode(newCode);
          setDescription(newDescription);
        },
        clear: () => {
          setCode("");
          setDescription("");
        },
      }),
      [code, description]
    );

    const handleFindClick = () => {
      onFindClick?.(searchType);
    };

    return (
      <>
        <label className="text-sm text-slate-700">{label}</label>

        <div className="rowfindmaster">
          <input
            className="inputtextbox w-full inputreadonly"
            value={code}
            disabled
            readOnly
          />

          <button
            type="button"
            className="btnfind"
            onClick={handleFindClick}
            disabled={disabled}
            title={`Find ${label}`}
          >
            <Search className="h-4 w-4" />
          </button>

          <input
            className="inputtextbox w-full inputreadonly"
            value={description}
            disabled
            readOnly
            />
        </div>

        
      </>
    );
  }
);

TextBoxMaster.displayName = "TextBoxMaster";

export default TextBoxMaster;