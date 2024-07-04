import { Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TCell } from "./TCell";
import { TFormat } from "./TFormat";

@Index("Col_pkey", ["col"], { unique: true })
@Entity("t-Col", { schema: "public" })
export class TCol {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Col" })
  col: string;

  @OneToMany(() => TCell, (tCell) => tCell.col)
  tCells: TCell[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.pgNestedCol)
  tFormats: TFormat[];
}
