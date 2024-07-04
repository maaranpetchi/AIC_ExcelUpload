import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TCell } from "./TCell";
import { TRow } from "./TRow";
import { TUser } from "./TUser";
import { TPg } from "./TPg";
import { TCol } from "./TCol";

@Index("Format_pkey", ["format"], { unique: true })
@Entity("t-Format", { schema: "public" })
export class TFormat {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Format" })
  format: string;

  @Column("bigint", { name: "Object" })
  object: string;

  @Column("bigint", { name: "Container", nullable: true })
  container: string | null;

  @Column("smallint", { name: "PG-Freeze-Col", nullable: true })
  pgFreezeCol: number | null;

  @Column("smallint", { name: "PG-Expand", nullable: true })
  pgExpand: number | null;

  @Column("jsonb", { name: "PG-Sort", nullable: true })
  pgSort: object | null;

  @Column("jsonb", { name: "PG-Filter", nullable: true })
  pgFilter: object | null;

  @Column("smallint", { name: "Col-Order", nullable: true })
  colOrder: number | null;

  @Column("smallint", { name: "Col-Min-Width", nullable: true })
  colMinWidth: number | null;

  @Column("smallint", { name: "Item-Order", nullable: true })
  itemOrder: number | null;

  @Column("jsonb", { name: "Font-Style", nullable: true })
  fontStyle: object | null;

  @Column("jsonb", { name: "Formula", nullable: true })
  formula: object | null;

  @Column("jsonb", { name: "Comment", nullable: true })
  comment: object | null;

  @Column("timestamp without time zone", { name: "Deleted-At", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => TCell, (tCell) => tCell.tFormats)
  @JoinColumn([{ name: "Default", referencedColumnName: "cell" }])
  default: TCell;

  @ManyToOne(() => TRow, (tRow) => tRow.tFormats)
  @JoinColumn([{ name: "Deleted", referencedColumnName: "row" }])
  deleted: TRow;

  @ManyToOne(() => TUser, (tUser) => tUser.tFormats)
  @JoinColumn([{ name: "Deleted-By", referencedColumnName: "user" }])
  deletedBy: TUser;

  @ManyToOne(() => TRow, (tRow) => tRow.tFormats2)
  @JoinColumn([{ name: "Object-Type", referencedColumnName: "row" }])
  objectType: TRow;

  @ManyToOne(() => TUser, (tUser) => tUser.tFormats2)
  @JoinColumn([{ name: "Owner", referencedColumnName: "user" }])
  owner: TUser;

  @ManyToOne(() => TPg, (tPg) => tPg.tFormats)
  @JoinColumn([{ name: "PG-Level-Set", referencedColumnName: "pg" }])
  pgLevelSet: TPg;

  @ManyToOne(() => TCol, (tCol) => tCol.tFormats)
  @JoinColumn([{ name: "PG-Nested-Col", referencedColumnName: "col" }])
  pgNestedCol: TCol;

  @ManyToOne(() => TPg, (tPg) => tPg.tFormats2)
  @JoinColumn([{ name: "PG-Search-Set", referencedColumnName: "pg" }])
  pgSearchSet: TPg;

  @ManyToOne(() => TRow, (tRow) => tRow.tFormats3)
  @JoinColumn([{ name: "RowSet-Tick", referencedColumnName: "row" }])
  rowSetTick: TRow;

  @ManyToOne(() => TRow, (tRow) => tRow.tFormats4)
  @JoinColumn([{ name: "Unit", referencedColumnName: "row" }])
  unit: TRow;

  @ManyToOne(() => TUser, (tUser) => tUser.tFormats3)
  @JoinColumn([{ name: "User", referencedColumnName: "user" }])
  user: TUser;
}
