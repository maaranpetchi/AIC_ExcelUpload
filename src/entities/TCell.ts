import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TCol } from "./TCol";
import { TRow } from "./TRow";
import { TFormat } from "./TFormat";

@Index("Cell_pkey", ["cell"], { unique: true })
@Entity("t-Cell", { schema: "public" })
export class TCell {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Cell" })
  cell: string;

  @Column("jsonb", { name: "DropDown-Source", nullable: true })
  dropDownSource: object | null;

  @ManyToOne(() => TCol, (tCol) => tCol.tCells)
  @JoinColumn([{ name: "Col", referencedColumnName: "col" }])
  col: TCol;

  @ManyToOne(() => TRow, (tRow) => tRow.tCells)
  @JoinColumn([{ name: "Data-Type", referencedColumnName: "row" }])
  dataType: TRow;

  @ManyToOne(() => TRow, (tRow) => tRow.tCells2)
  @JoinColumn([{ name: "Row", referencedColumnName: "row" }])
  row: TRow;

  @OneToMany(() => TFormat, (tFormat) => tFormat.default)
  tFormats: TFormat[];
}
