import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { tCell } from "./tCell";
import { tFormat } from "./tFormat";
import { tItem } from "./tItem";
import { tPg } from "./tPg";
import { tTx } from "./tTx";
import { tUser } from "./tUser";

@Index("Row_pkey", ["row"], { unique: true })
@Entity("tRow", { schema: "public" })
export class tRow {
  @PrimaryColumn({ type: "bigint", name: "Row" })
  row: string;

  @Column("smallint", { name: "RowLevel" })
  rowLevel: number;

  @Column("bigint", {name: "Inherit", array: true})
  inherit: BigInt[];

  @OneToMany(() => tCell, (tCell) => tCell.dataType)
  tCells: tCell[];

  @OneToMany(() => tCell, (tCell) => tCell.row)
  tCells2: tCell[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.deleted)
  tFormats: tFormat[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.objectType)
  tFormats2: tFormat[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.rowSetTick)
  tFormats3: tFormat[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.unit)
  tFormats4: tFormat[];

  @OneToMany(() => tItem, (tItem) => tItem.dataType)
  tItems: tItem[];

  @OneToMany(() => tItem, (tItem) => tItem.stdUnit)
  tItems2: tItem[];

  @OneToMany(() => tItem, (tItem) => tItem.unit)
  tItems3: tItem[];

  @ManyToOne(() => tPg, (tPg) => tPg.tRows)
  @JoinColumn([{ name: "Pg", referencedColumnName: "pg" }])
  pg: tPg;

  @ManyToOne(() => tRow, (tRow) => tRow.tRows)
  @JoinColumn([{ name: "ParentRow", referencedColumnName: "row" }])
  parentRow: tRow;

  @OneToMany(() => tRow, (tRow) => tRow.parentRow)
  tRows: tRow[];

  @ManyToOne(() => tRow, (tRow) => tRow.tRows2)
  @JoinColumn([{ name: "Share", referencedColumnName: "row" }])
  share: tRow;

  @OneToMany(() => tRow, (tRow) => tRow.share)
  tRows2: tRow[];

  @ManyToOne(() => tRow, (tRow) => tRow.tRows3)
  @JoinColumn([{ name: "SiblingRow", referencedColumnName: "row" }])
  siblingRow: tRow;

  @OneToMany(() => tRow, (tRow) => tRow.siblingRow)
  tRows3: tRow[];

  @OneToMany(() => tTx, (tTx) => tTx.txType)
  tTxes: tTx[];

  @OneToMany(() => tUser, (tUser) => tUser.userType)
  tUsers: tUser[];

  @OneToMany(() => tUser, (tUser) => tUser.userType2)
  tUsers2: tUser[];
}
