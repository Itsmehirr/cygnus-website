import Link from "next/link";
import type { Piece } from "@/content/pieces";
import { getCategory, getCollection } from "@/content/collections";
import { Picture } from "./Picture";

export function PieceCard({
  piece,
  showCollection = true,
}: {
  piece: Piece;
  showCollection?: boolean;
}) {
  const category = getCategory(piece.category);
  const collection = getCollection(piece.collection);
  const cover = piece.images[0];
  return (
    <Link href={`/sanctuary/pieces/${piece.slug}`} className="tile">
      <div className="tile__media">
        <Picture
          src={cover.src}
          alt={cover.alt}
          ratio="portrait"
          label={piece.name}
        />
      </div>
      <div className="tile__body">
        <span className="tile__title">{piece.name}</span>
        <span className="tile__meta">
          {showCollection ? collection?.name : category?.name}
        </span>
      </div>
    </Link>
  );
}
