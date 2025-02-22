// src/types/dataTypes.ts

export interface LtDataEntry {
    id?: string;
    Imb_price?: number;
    fw_c?: number;
    fw_d?:  number;
    fw_net_discharge?:  number;
    fw_soc?: number;
    SI?: number;
  }

  export interface StDataEntry {
    id?: string;
    lookahead_timesteps : string[];
    quantiles: number[];
    SI?: number;
    Imb_price?: number;
    fw_d?:  Record<string,number>;
    fw_net_discharge?:  Record<string,number>;
    fw_soc?: Record<string,number>;
    pred_imb_price_fc?: Record<string,number[]>;
    pred_SI_fc?: Record<string,number[]>;

  }
  