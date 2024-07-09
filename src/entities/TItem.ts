import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { tRow } from "./tRow";

@Index("Item_pkey", ["item"], { unique: true })
@Entity("tItem", { schema: "public" })
export class tItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Item" })
  item: string;

  @Column("bigint", { name: "Object", nullable: true })
  object: string | null;

  @Column("smallint", { name: "SmallInt", nullable: true })
  smallInt: number | null;

  @Column("bigint", { name: "BigInt", nullable: true })
  bigInt: string | null;

  @Column("numeric", { name: "Num", nullable: true })
  num: string | null;

  @Column("bytea", { name: "Color", nullable: true })
  color: Buffer | null;

  @Column("timestamp without time zone", { name: "DateTime", nullable: true })
  dateTime: Date | null;

  @Column("jsonb", { name: "JSON", nullable: true })
  json: object | null;

  @Column("numeric", { name: "Qty", nullable: true })
  qty: string | null;

  @Column("numeric", { name: "StdQty", nullable: true })
  stdQty: string | null;

  @Column("jsonb", { name: "Foreign", nullable: true })
  foreign: object | null;

  @ManyToOne(() => tRow, (tRow) => tRow.tItems)
  @JoinColumn([{ name: "DataType", referencedColumnName: "row" }])
  dataType: tRow;

  @ManyToOne(() => tRow, (tRow) => tRow.tItems2)
  @JoinColumn([{ name: "StdUnit", referencedColumnName: "row" }])
  stdUnit: tRow;

  @ManyToOne(() => tRow, (tRow) => tRow.tItems3)
  @JoinColumn([{ name: "Unit", referencedColumnName: "row" }])
  unit: tRow;
}
