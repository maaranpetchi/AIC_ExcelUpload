import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TRow } from "./TRow";

@Index("Item_pkey", ["item"], { unique: true })
@Entity("t-Item", { schema: "public" })
export class TItem {
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

  @Column("numeric", { name: "Std-Qty", nullable: true })
  stdQty: string | null;

  @Column("jsonb", { name: "Foreign", nullable: true })
  foreign: object | null;

  @ManyToOne(() => TRow, (tRow) => tRow.tItems)
  @JoinColumn([{ name: "Data-Type", referencedColumnName: "row" }])
  dataType: TRow;

  @ManyToOne(() => TRow, (tRow) => tRow.tItems2)
  @JoinColumn([{ name: "Std-Unit", referencedColumnName: "row" }])
  stdUnit: TRow;

  @ManyToOne(() => TRow, (tRow) => tRow.tItems3)
  @JoinColumn([{ name: "Unit", referencedColumnName: "row" }])
  unit: TRow;
}
