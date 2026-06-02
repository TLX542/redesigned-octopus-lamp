module serial_template (
    input sys_clk,
    input sys_rst_n,
    output [5:0] bled,
    input [3:0] sw,
    input [3:0] btn,
    output [7:0] led,
    output [7:0] seven,
    output [3:0] segment,
    input uart_rx
);

lab_timer lab_timer_i (
    .sys_clk(sys_clk),
    .sys_rst_n(sys_rst_n),
    .bled(bled),
    .sw(sw),
    .btn(btn),
    .led(led),
    .seven(seven),
    .segment(segment),
    .uart_rx(uart_rx)
);

endmodule
