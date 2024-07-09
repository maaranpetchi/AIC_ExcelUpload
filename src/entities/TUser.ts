import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { tFormat } from "./tFormat";
import { tTx } from "./tTx";
import { tRow } from "./tRow";

@Index("User_ukey", ["user"], { unique: true })
@Entity("tUser", { schema: "public" })
export class tUser {
 
  @PrimaryColumn({ name: "User",primary: false })
  user: string;

  @OneToMany(() => tFormat, (tFormat) => tFormat.deletedBy)
  tFormats: tFormat[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.owner)
  tFormats2: tFormat[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.user)
  tFormats3: tFormat[];

  @OneToMany(() => tTx, (tTx) => tTx.txUser)
  tTxes: tTx[];

  @ManyToOne(() => tRow, (tRow) => tRow.tUsers)
  @JoinColumn([{ name: "UserType", referencedColumnName: "row" }])
  userType: tRow;

  @ManyToOne(() => tRow, (tRow) => tRow.tUsers2)
  @JoinColumn([{ name: "UserType", referencedColumnName: "row" }])
  userType2: tRow;
}
