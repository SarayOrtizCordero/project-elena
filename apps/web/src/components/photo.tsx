import Image from "next/image";
import { cn } from "@elena/ui";

type PhotoProps = {
  src: string;
  alt: string;
  /** red = duotono rojo/negro · mono = blanco y negro · natural = sin filtro */
  tone?: "red" | "mono" | "natural";
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
};

/** Foto con tratamiento de marca. El rojo del contenedor se multiplica con la foto en gris. */
export function Photo({ src, alt, tone = "red", sizes = "100vw", priority, className, imgClassName }: PhotoProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", tone === "red" ? "bg-brand" : "bg-ink", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover",
          tone === "red" && "mix-blend-multiply grayscale contrast-125 brightness-110",
          tone === "mono" && "grayscale contrast-110",
          imgClassName,
        )}
      />
    </div>
  );
}
