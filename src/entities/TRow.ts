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
import { TCell } from "./TCell";
import { TFormat } from "./TFormat";
import { TItem } from "./TItem";
import { TPg } from "./TPg";
import { TTx } from "./TTx";
import { TUser } from "./TUser";

@Index("Row_pkey", ["row"], { unique: true })
@Entity("t-Row", { schema: "public" })
export class TRow {
  @PrimaryColumn({ type: "bigint", name: "Row" })
  row: string;

  @Column("smallint", { name: "Row-Level" })
  rowLevel: number;

  @Column("bigint", {name: "Inherit", array: true})
  inherit: BigInt[];

  @OneToMany(() => TCell, (tCell) => tCell.dataType)
  tCells: TCell[];

  @OneToMany(() => TCell, (tCell) => tCell.row)
  tCells2: TCell[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.deleted)
  tFormats: TFormat[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.objectType)
  tFormats2: TFormat[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.rowSetTick)
  tFormats3: TFormat[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.unit)
  tFormats4: TFormat[];

  @OneToMany(() => TItem, (tItem) => tItem.dataType)
  tItems: TItem[];

  @OneToMany(() => TItem, (tItem) => tItem.stdUnit)
  tItems2: TItem[];

  @OneToMany(() => TItem, (tItem) => tItem.unit)
  tItems3: TItem[];

  @ManyToOne(() => TPg, (tPg) => tPg.tRows)
  @JoinColumn([{ name: "PG", referencedColumnName: "pg" }])
  pg: TPg;

  @ManyToOne(() => TRow, (tRow) => tRow.tRows)
  @JoinColumn([{ name: "Parent-Row", referencedColumnName: "row" }])
  parentRow: TRow;

  @OneToMany(() => TRow, (tRow) => tRow.parentRow)
  tRows: TRow[];

  @ManyToOne(() => TRow, (tRow) => tRow.tRows2)
  @JoinColumn([{ name: "Share", referencedColumnName: "row" }])
  share: TRow;

  @OneToMany(() => TRow, (tRow) => tRow.share)
  tRows2: TRow[];

  @ManyToOne(() => TRow, (tRow) => tRow.tRows3)
  @JoinColumn([{ name: "Sibling-Row", referencedColumnName: "row" }])
  siblingRow: TRow;

  @OneToMany(() => TRow, (tRow) => tRow.siblingRow)
  tRows3: TRow[];

  @OneToMany(() => TTx, (tTx) => tTx.txType)
  tTxes: TTx[];

  @OneToMany(() => TUser, (tUser) => tUser.userType)
  tUsers: TUser[];

  @OneToMany(() => TUser, (tUser) => tUser.userType2)
  tUsers2: TUser[];
}
