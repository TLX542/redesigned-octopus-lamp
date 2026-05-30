module lab_timer (
    input sys_clk,
    input sys_rst_n,
    output [5:0] bled,
    input [3:0] sw,
    input [3:0] btn,
    output reg [7:0] led,
    output reg [7:0] seven,
    output reg [3:0] segment,
    input uart_rx
);

parameter CLK_FRE  = 27;     // MHz
parameter UART_FRE = 115200; // bps
localparam [24:0] ONE_SEC_TICKS = (CLK_FRE * 1000000) - 1;

wire [7:0] rx_data;
wire       rx_data_valid;
wire       rx_data_ready;

assign rx_data_ready = 1'b1;
assign bled = 6'b111111;

// Unused in this design, kept for pin compatibility.
wire _unused_sw = &sw;

uart_rx #(
    .CLK_FRE(CLK_FRE),
    .BAUD_RATE(UART_FRE)
) uart_rx_inst (
    .clk(sys_clk),
    .rst_n(sys_rst_n),
    .rx_data(rx_data),
    .rx_data_valid(rx_data_valid),
    .rx_data_ready(rx_data_ready),
    .rx_pin(uart_rx)
);

// Display scan
reg [15:0] disp_counter;
reg [1:0] seg_counter;

// User-entered MM:SS (BCD digits)
reg [3:0] set_d3;
reg [3:0] set_d2;
reg [3:0] set_d1;
reg [3:0] set_d0;

// Countdown state
reg        running;
reg [24:0] sec_counter;
reg [13:0] total_seconds; // 0..5999 for 99:59

// Button synchronizer and edge detector (BUTTON0)
reg btn0_sync0;
reg btn0_sync1;
reg btn0_prev;

reg [6:0] start_minutes;
reg [6:0] start_seconds;
reg [13:0] start_total;
reg [15:0] next_bcd;
reg [13:0] next_total_seconds;

reg [3:0] disp_d3;
reg [3:0] disp_d2;
reg [3:0] disp_d1;
reg [3:0] disp_d0;

function [6:0] hex2seven;
    input [3:0] x;
    begin
        case (x)
            4'h0: hex2seven = 7'b00111111;
            4'h1: hex2seven = 7'b00000110;
            4'h2: hex2seven = 7'b01011011;
            4'h3: hex2seven = 7'b01001111;
            4'h4: hex2seven = 7'b01100110;
            4'h5: hex2seven = 7'b01101101;
            4'h6: hex2seven = 7'b01111101;
            4'h7: hex2seven = 7'b00000111;
            4'h8: hex2seven = 7'b01111111;
            4'h9: hex2seven = 7'b01101111;
            4'hA: hex2seven = 7'b01110111;
            4'hB: hex2seven = 7'b01111100;
            4'hC: hex2seven = 7'b00111001;
            4'hD: hex2seven = 7'b01011110;
            4'hE: hex2seven = 7'b01111001;
            default: hex2seven = 7'b01110001;
        endcase
    end
endfunction

function [15:0] sec_to_bcd;
    input [13:0] secs_total;
    reg [6:0] mins;
    reg [5:0] secs;
    begin
        mins = secs_total / 14'd60;
        secs = secs_total % 14'd60;
        sec_to_bcd[15:12] = mins / 7'd10;
        sec_to_bcd[11:8]  = mins % 7'd10;
        sec_to_bcd[7:4]   = secs / 6'd10;
        sec_to_bcd[3:0]   = secs % 6'd10;
    end
endfunction

always @(*) begin
    start_minutes = (set_d3 * 4'd10) + set_d2;
    start_seconds = (set_d1 * 4'd10) + set_d0;
    start_total = (start_minutes * 7'd60) + start_seconds;
end

always @(posedge sys_clk or negedge sys_rst_n) begin
    if (!sys_rst_n) begin
        disp_counter <= 16'd0;
        seg_counter <= 2'd0;
    end else begin
        disp_counter <= disp_counter + 16'd1;
        if (disp_counter == 16'd0) begin
            seg_counter <= seg_counter + 2'd1;
        end
    end
end

always @(posedge sys_clk or negedge sys_rst_n) begin
    if (!sys_rst_n) begin
        btn0_sync0 <= 1'b1;
        btn0_sync1 <= 1'b1;
        btn0_prev <= 1'b1;

        led <= 8'd0;
        set_d3 <= 4'd0;
        set_d2 <= 4'd0;
        set_d1 <= 4'd0;
        set_d0 <= 4'd0;
        disp_d3 <= 4'd0;
        disp_d2 <= 4'd0;
        disp_d1 <= 4'd0;
        disp_d0 <= 4'd0;

        running <= 1'b0;
        sec_counter <= 25'd0;
        total_seconds <= 14'd0;
    end else begin
        // Synchronize button to local clock domain.
        btn0_sync0 <= btn[0];
        btn0_sync1 <= btn0_sync0;
        btn0_prev <= btn0_sync1;

        if (rx_data_valid) begin
            led <= rx_data;

            // Accept numeric ASCII only when timer is not running.
            if (!running && (rx_data >= 8'd48) && (rx_data <= 8'd57)) begin
                set_d3 <= set_d2;
                set_d2 <= set_d1;
                set_d1 <= set_d0;
                set_d0 <= rx_data[3:0];

                disp_d3 <= set_d2;
                disp_d2 <= set_d1;
                disp_d1 <= set_d0;
                disp_d0 <= rx_data[3:0];
            end
        end

        // Start countdown on BUTTON0 falling edge (active-low button).
        if (!running && btn0_prev && !btn0_sync1 && (start_total != 14'd0)) begin
            running <= 1'b1;
            sec_counter <= 25'd0;
            total_seconds <= start_total;
        end else if (running) begin
            if (total_seconds == 14'd0) begin
                running <= 1'b0;
            end else if (sec_counter == ONE_SEC_TICKS) begin
                sec_counter <= 25'd0;
                if (total_seconds > 14'd1) begin
                    next_total_seconds = total_seconds - 14'd1;
                    total_seconds <= next_total_seconds;
                    next_bcd = sec_to_bcd(next_total_seconds);
                    disp_d3 <= next_bcd[15:12];
                    disp_d2 <= next_bcd[11:8];
                    disp_d1 <= next_bcd[7:4];
                    disp_d0 <= next_bcd[3:0];
                end else if (total_seconds == 14'd1) begin
                    total_seconds <= 14'd0;
                    running <= 1'b0;
                    disp_d3 <= 4'd0;
                    disp_d2 <= 4'd0;
                    disp_d1 <= 4'd0;
                    disp_d0 <= 4'd0;
                end
            end else begin
                sec_counter <= sec_counter + 25'd1;
            end
        end
    end
end

always @(*) begin
    case (seg_counter)
        2'b00: begin
            seven = {1'b0, hex2seven(disp_d0)};
            segment = 4'b0001;
        end
        2'b01: begin
            seven = {1'b0, hex2seven(disp_d1)};
            segment = 4'b0010;
        end
        2'b10: begin
            seven = {1'b1, hex2seven(disp_d2)}; // keep center dot on
            segment = 4'b0100;
        end
        default: begin
            seven = {1'b0, hex2seven(disp_d3)};
            segment = 4'b1000;
        end
    endcase
end

endmodule
