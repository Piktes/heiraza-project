"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";

interface GeoLocation {
    id: number;
    name: string;
    country?: string;
    admin1?: string; // State
}

interface LocationAutocompleteProps {
    onSelect: (city: string, country: string) => void;
    initialCity?: string;
    initialCountry?: string;
    disabled?: boolean;
}

export function LocationAutocomplete({
    onSelect,
    initialCity = "",
    initialCountry = "",
    disabled = false,
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState(
        initialCity && initialCountry ? `${initialCity}, ${initialCountry}` : ""
    );
    const [results, setResults] = useState<GeoLocation[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // Debounced search
    const searchLocations = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=10&language=en&format=json`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch locations");
            }

            const data = await response.json();

            if (data.results) {
                setResults(data.results);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Location search failed:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);

        // Clear selected values when typing
        if (selectedCity || selectedCountry) {
            setSelectedCity("");
            setSelectedCountry("");
        }

        // Debounce the search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchLocations(value);
        }, 300);
    };

    // Handle location selection
    const handleSelect = (location: GeoLocation) => {
        const city = location.name;
        // Use admin1 (State) if available, but prioritize Country for the second field
        const country = location.country || "";
        const displayLabel = country ? `${city}, ${country}` : city;

        setSelectedCity(city);
        setSelectedCountry(country);
        setQuery(displayLabel);
        setIsOpen(false);
        setResults([]);

        onSelect(city, country);
    };

    // Handle clear
    const handleClear = () => {
        setQuery("");
        setSelectedCity("");
        setSelectedCountry("");
        setResults([]);
        onSelect("", "");
        inputRef.current?.focus();
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div className="relative">
            <label className="block text-sm font-medium mb-2">
                <MapPin size={16} className="inline mr-2" />
                City & Country *
            </label>

            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search size={18} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="Start typing a city name..."
                    disabled={disabled}
                    className="input-field pl-12 pr-10"
                    autoComplete="off"
                />

                {/* Clear button */}
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Loading indicator */}
                {loading && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (results.length > 0 || loading) && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                >
                    {results.length > 0 ? (
                        <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                            {results.map((location) => (
                                <li key={location.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(location)}
                                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                                    >
                                        <MapPin size={16} className="text-muted-foreground flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">
                                                {location.name}
                                                {location.admin1 && location.admin1 !== location.name && (
                                                    <span className="text-muted-foreground font-normal">
                                                        , {location.admin1}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {location.country}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : loading ? (
                        <div className="px-4 py-6 text-center text-muted-foreground">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                            <p className="text-sm">Searching locations...</p>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Hidden inputs for form submission */}
            <input type="hidden" name="city" value={selectedCity} />
            <input type="hidden" name="country" value={selectedCountry} />

            {/* Help text */}
            <p className="text-xs text-muted-foreground mt-1">
                Type to search for a city, then select from the dropdown
            </p>
        </div>
    );
}
