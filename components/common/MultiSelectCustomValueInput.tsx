'use client'

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (newValue: string[]) => void;
  exampleTag?: string;
  placeholder?: string;
}

function TagInput({ label, value, onChange, exampleTag = "", placeholder = "" }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showExample, setShowExample] = useState(!!exampleTag && value.length === 0);

  useEffect(() => {
    setShowExample(!!exampleTag && value.length === 0);
  }, [value, exampleTag]);

  const handleAddTag = () => {
    if (!inputValue.trim()) return;

    // Normalize: trim and capitalize first letter of each word
    const normalized = inputValue
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Avoid duplicates
    if (!value.includes(normalized)) {
      onChange([...value, normalized]);
    }

    setInputValue("");
  };

  const handleRemoveTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <div
            key={tag}
            className="flex items-center bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="ml-1 text-red-500 font-bold"
              onClick={() => handleRemoveTag(tag)}
            >
              &times;
            </button>
          </div>
        ))}
        {showExample && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full text-sm text-gray-400">
            {exampleTag}
          </div>
        )}
      </div>
      <Input
        placeholder={placeholder || "Type and press Enter"}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default TagInput;
