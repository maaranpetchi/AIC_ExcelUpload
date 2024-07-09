import { Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { tFormat } from "./tFormat";
import { tRow } from "./tRow";

@Index("Pg_pkey", ["pg"], { unique: true })
@Entity("tPg", { schema: "public" })
export class tPg {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Pg" })
  pg: string;

  @OneToMany(() => tFormat, (tFormat) => tFormat.pgLevelSet)
  tFormats: tFormat[];

  @OneToMany(() => tFormat, (tFormat) => tFormat.pgSearchSet)
  tFormats2: tFormat[];

  @OneToMany(() => tRow, (tRow) => tRow.pg)
  tRows: tRow[];
}
