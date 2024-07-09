import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { tCell } from "./tCell";
import { tRow } from "./tRow";
import { tUser } from "./tUser";
import { tPg } from "./tPg";
import { tCol } from "./tCol";

@Index("Format_pkey", ["format"], { unique: true })
@Entity("tFormat", { schema: "public" })
export class tFormat {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Format" })
  format: string;

  @Column("bigint", { name: "Object" })
  object: string;

  @Column("bigint", { name: "Container", nullable: true })
  container: string | null;

  @Column("smallint", { name: "PGFreezeCol", nullable: true })
  pgFreezeCol: number | null;

  @Column("smallint", { name: "PGExpand", nullable: true })
  pgExpand: number | null;

  @Column("jsonb", { name: "PGSort", nullable: true })
  pgSort: object | null;

  @Column("jsonb", { name: "PGFilter", nullable: true })
  pgFilter: object | null;

  @Column("smallint", { name: "ColOrder", nullable: true })
  colOrder: number | null;

  @Column("smallint", { name: "ColMinWidth", nullable: true })
  colMinWidth: number | null;

  @Column("smallint", { name: "ItemOrder", nullable: true })
  itemOrder: number | null;

  @Column("jsonb", { name: "FontStyle", nullable: true })
  fontStyle: object | null;

  @Column("jsonb", { name: "Formula", nullable: true })
  formula: object | null;

  @Column("jsonb", { name: "Comment", nullable: true })
  comment: object | null;

  @Column("timestamp without time zone", { name: "DeletedAt", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => tCell, (tCell) => tCell.tFormats)
  @JoinColumn([{ name: "Default", referencedColumnName: "cell" }])
  default: tCell;

  @ManyToOne(() => tRow, (tRow) => tRow.tFormats)
  @JoinColumn([{ name: "Deleted", referencedColumnName: "row" }])
  deleted: tRow;

  @ManyToOne(() => tUser, (tUser) => tUser.tFormats)
  @JoinColumn([{ name: "DeletedBy", referencedColumnName: "user" }])
  deletedBy: tUser;

  @ManyToOne(() => tRow, (tRow) => tRow.tFormats2)
  @JoinColumn([{ name: "ObjectType", referencedColumnName: "row" }])
  objectType: tRow;

  @ManyToOne(() => tUser, (tUser) => tUser.tFormats2)
  @JoinColumn([{ name: "Owner", referencedColumnName: "user" }])
  owner: tUser;

  @ManyToOne(() => tPg, (tPg) => tPg.tFormats)
  @JoinColumn([{ name: "PGLevelSet", referencedColumnName: "pg" }])
  pgLevelSet: tPg;

  @ManyToOne(() => tCol, (tCol) => tCol.tFormats)
  @JoinColumn([{ name: "PGNestedCol", referencedColumnName: "col" }])
  pgNestedCol: tCol;

  @ManyToOne(() => tPg, (tPg) => tPg.tFormats2)
  @JoinColumn([{ name: "PGSearchSet", referencedColumnName: "pg" }])
  pgSearchSet: tPg;

  @ManyToOne(() => tRow, (tRow) => tRow.tFormats3)
  @JoinColumn([{ name: "RowSetTick", referencedColumnName: "row" }])
  rowSetTick: tRow;

  @ManyToOne(() => tRow, (tRow) => tRow.tFormats4)
  @JoinColumn([{ name: "Unit", referencedColumnName: "row" }])
  unit: tRow;

  @ManyToOne(() => tUser, (tUser) => tUser.tFormats3)
  @JoinColumn([{ name: "User", referencedColumnName: "user" }])
  user: tUser;
}
