import { Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { tCell } from "./tCell";
import { tFormat } from "./tFormat";

@Index("Col_pkey", ["col"], { unique: true })
@Entity("tCol", { schema: "public" })
export class tCol {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Col" })
  col: string;

  @OneToMany(() => tCell, (tCell) => tCell.col)
  tCells: tCell[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.pgNestedCol)
  tFormats: tFormat[];
}
