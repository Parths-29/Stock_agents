import { pets, type PetId } from "@/lib/market";
export default function PetAvatar({
  id,
  size = 64,
}: {
  id: PetId;
  size?: number;
}) {
  const pet = pets.find((p) => p.id === id)!;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-label={`${pet.name} the ${pet.animal.toLowerCase()}`}
      role="img"
    >
      {id === "mochi" && (
        <>
          <path
            d="M17 36 14 10 34 24H48L66 10 64 39"
            fill={pet.color}
            stroke="#0D1B2A"
            strokeWidth="3"
          />
          <path d="m20 18 3 14 9-5M59 18l-9 9 9 5" fill="#FF6F61" />
        </>
      )}
      {id === "boba" && (
        <>
          <path
            d="M17 38 15 8 35 23H47L65 8 64 38"
            fill={pet.color}
            stroke="#0D1B2A"
            strokeWidth="3"
          />
          <path d="m21 19 2 11 8-4m28-7-1 11-8-4" fill="#0D1B2A" />
        </>
      )}
      {id === "kip" && (
        <g stroke={pet.color} strokeWidth="6" strokeLinecap="square">
          <path d="m18 32-12-9m12 18H3m15 8L6 58m56-26 12-9M62 41h15M62 49l12 9" />
        </g>
      )}
      {id === "hoot" && (
        <path
          d="M15 39V12l24 12 26-12v29"
          fill={pet.color}
          stroke="#0D1B2A"
          strokeWidth="3"
        />
      )}
      <path
        d={
          id === "claude"
            ? "M15 48V35a25 25 0 0 1 50 0v13l8 17-9 4-9-12-5 15-10-12-10 12-5-15-9 12-9-4Z"
            : "M14 40c0-16 11-22 26-22s26 6 26 22v9c0 16-13 21-26 21S14 65 14 49Z"
        }
        fill={pet.color}
        stroke="#0D1B2A"
        strokeWidth="3"
      />
      {id === "hoot" && (
        <>
          <circle cx="28" cy="42" r="12" fill="#F4F1DE" />
          <circle cx="52" cy="42" r="12" fill="#F4F1DE" />
        </>
      )}
      {id === "boba" && (
        <ellipse cx="40" cy="53" rx="19" ry="13" fill="#F4F1DE" />
      )}
      <path d="M26 39v8m28-8v8" stroke="#0D1B2A" strokeWidth="5" />
      <path
        d={id === "hoot" ? "m36 50 4 6 4-6Z" : "m35 52 5 4 5-4m-5 4v4"}
        stroke="#0D1B2A"
        strokeWidth="2.5"
      />
      {id === "mochi" && (
        <path
          d="m9 48 13 3M8 55l13-1m50-6-13 3m14 4-13-1"
          stroke="#0D1B2A"
          strokeWidth="2"
        />
      )}
      <path d="M21 71h12m14 0h12" stroke={pet.color} strokeWidth="6" />
    </svg>
  );
}
