import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { tRow } from "./tRow";
import { tUser } from "./tUser";

@Index("Tx_pkey", ["txXid"], { unique: true })
@Entity("tTx", { schema: "public" })
export class tTx {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Tx" })
  tx: string;

  @Column("jsonb", { name: "TxAuditTrail", nullable: true })
  txAuditTrail: object | null;

  @Column("timestamp without time zone", { name: "TxDateTime" })
  txDateTime: Date;

  @Column("bigint", { primary: true, name: "TxXID" })
  txXid: string;

  @ManyToOne(() => tRow, (tRow) => tRow.tTxes)
  @JoinColumn([{ name: "TxType", referencedColumnName: "row" }])
  txType: tRow;

  @ManyToOne(() => tUser, (tUser) => tUser.tTxes)
  @JoinColumn([{ name: "TxUser", referencedColumnName: "user" }])
  txUser: tUser;
}
