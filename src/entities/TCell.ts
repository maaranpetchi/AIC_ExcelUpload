import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { tCol } from "./tCol";
import { tRow } from "./tRow";
import { tFormat } from "./tFormat";

@Index("Cell_pkey", ["cell"], { unique: true })
@Entity("tCell", { schema: "public" })
export class tCell {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Cell" })
  cell: string;

  @Column("jsonb", { name: "DropDownSource", nullable: true })
  dropDownSource: object | null;

  @ManyToOne(() => tCol, (tCol) => tCol.tCells)
  @JoinColumn([{ name: "Col", referencedColumnName: "col" }])
  col: tCol;

  @ManyToOne(() => tRow, (tRow) => tRow.tCells)
  @JoinColumn([{ name: "DataType", referencedColumnName: "row" }])
  dataType: tRow;

  @ManyToOne(() => tRow, (tRow) => tRow.tCells2)
  @JoinColumn([{ name: "Row", referencedColumnName: "row" }])
  row: tRow;

  @OneToMany(() => tFormat, (tFormat) => tFormat.default)
  tFormats: tFormat[];
}
