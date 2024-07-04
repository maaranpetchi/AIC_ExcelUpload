import { Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TFormat } from "./TFormat";
import { TRow } from "./TRow";

@Index("PG_pkey", ["pg"], { unique: true })
@Entity("t-PG", { schema: "public" })
export class TPg {
  @PrimaryGeneratedColumn({ type: "bigint", name: "PG" })
  pg: string;

  @OneToMany(() => TFormat, (tFormat) => tFormat.pgLevelSet)
  tFormats: TFormat[];

  @OneToMany(() => TFormat, (tFormat) => tFormat.pgSearchSet)
  tFormats2: TFormat[];

  @OneToMany(() => TRow, (tRow) => tRow.pg)
  tRows: TRow[];
}
