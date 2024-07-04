import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TRow } from "./TRow";
import { TUser } from "./TUser";

@Index("Tx_pkey", ["txXid"], { unique: true })
@Entity("t-Tx", { schema: "public" })
export class TTx {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Tx" })
  tx: string;

  @Column("jsonb", { name: "Tx-AuditTrail", nullable: true })
  txAuditTrail: object | null;

  @Column("timestamp without time zone", { name: "Tx-DateTime" })
  txDateTime: Date;

  @Column("bigint", { primary: true, name: "Tx-XID" })
  txXid: string;

  @ManyToOne(() => TRow, (tRow) => tRow.tTxes)
  @JoinColumn([{ name: "Tx-Type", referencedColumnName: "row" }])
  txType: TRow;

  @ManyToOne(() => TUser, (tUser) => tUser.tTxes)
  @JoinColumn([{ name: "Tx-User", referencedColumnName: "user" }])
  txUser: TUser;
}
