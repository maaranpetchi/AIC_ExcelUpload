import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { TFormat } from "./TFormat";
import { TTx } from "./TTx";
import { TRow } from "./TRow";

@Index("User_ukey", ["user"], { unique: true })
@Entity("t-User", { schema: "public" })
export class TUser {
  // @Column("USER-DEFINED", { name: "User", unique: true })
  // user: string;
  @PrimaryColumn({ name: "User",primary: false })
  user: string;

  @OneToMany(() => TFormat, (tFormat) => tFormat.deletedBy)
  tFormats: TFormat[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.owner)
  tFormats2: TFormat[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.user)
  tFormats3: TFormat[];

  @OneToMany(() => TTx, (tTx) => tTx.txUser)
  tTxes: TTx[];

  @ManyToOne(() => TRow, (tRow) => tRow.tUsers)
  @JoinColumn([{ name: "User-Type", referencedColumnName: "row" }])
  userType: TRow;

  @ManyToOne(() => TRow, (tRow) => tRow.tUsers2)
  @JoinColumn([{ name: "User-Type", referencedColumnName: "row" }])
  userType2: TRow;
}
