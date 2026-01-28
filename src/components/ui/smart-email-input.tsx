"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { AtSign } from "lucide-react";

// US-focused email domains + global providers
const EMAIL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "msn.com",
    "live.com",
    "comcast.net",
    "me.com",
    "sbcglobal.net",
    "verizon.net",
    "att.net",
    "proton.me",
];

interface SmartEmailInputProps {
    id?: string;
    name?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export function SmartEmailInput({
    id = "email",
    name = "email",
    required = true,
    placeholder = "john@example.com",
    className = "",
    value: controlledValue,
    onChange,
}: SmartEmailInputProps) {
    const [internalValue, setInternalValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredDomains, setFilteredDomains] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use controlled or uncontrolled value
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const setValue = (newValue: string) => {
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    // Handle input change
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        // Check if we should show suggestions
        const atIndex = newValue.lastIndexOf("@");
        if (atIndex !== -1) {
            const afterAt = newValue.slice(atIndex + 1).toLowerCase();

            // Filter domains based on what's typed after @
            const matches = EMAIL_DOMAINS.filter((domain) =>
                domain.toLowerCase().startsWith(afterAt)
            );

            if (matches.length > 0 && afterAt.length < matches[0].length) {
                setFilteredDomains(matches);
                setShowSuggestions(true);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    // Handle domain selection
    const selectDomain = (domain: string) => {
        const atIndex = value.lastIndexOf("@");
        if (atIndex !== -1) {
            const beforeAt = value.slice(0, atIndex + 1);
            setValue(beforeAt + domain);
        }
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredDomains.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                break;
            case "Tab":
            case "Enter":
                if (filteredDomains.length > 0) {
                    e.preventDefault();
                    selectDomain(filteredDomains[selectedIndex]);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative">
            <AtSign
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={18}
            />
            <input
                ref={inputRef}
                type="email"
                id={id}
                name={name}
                required={required}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className={`input-field pl-12 ${className}`}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredDomains.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 z-50 glass-card rounded-xl overflow-hidden shadow-xl border border-border animate-fade-in"
                >
                    <ul className="py-2 max-h-60 overflow-y-auto">
                        {filteredDomains.map((domain, index) => {
                            const atIndex = value.lastIndexOf("@");
                            const beforeAt = atIndex !== -1 ? value.slice(0, atIndex) : value;

                            return (
                                <li key={domain}>
                                    <button
                                        type="button"
                                        onClick={() => selectDomain(domain)}
                                        className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-2 ${index === selectedIndex
                                                ? "bg-accent-coral/10 text-accent-coral"
                                                : "hover:bg-muted"
                                            }`}
                                    >
                                        <AtSign size={14} className="text-muted-foreground" />
                                        <span>
                                            <span className="text-muted-foreground">{beforeAt}@</span>
                                            <span className="font-medium">{domain}</span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
