module demo_move_call::demo_action {
    use sui::event;
    use sui::tx_context::{Self, TxContext};

    public struct ActionMarked has copy, drop {
        trace_id: vector<u8>,
        semantic_type: vector<u8>,
        sender: address,
    }

    public struct CopyTradeMirrored has copy, drop {
        source_trace_id: vector<u8>,
        follower_trace_id: vector<u8>,
        max_exposure_mist: u64,
        sender: address,
    }

    public entry fun mark_action(
        trace_id: vector<u8>,
        semantic_type: vector<u8>,
        ctx: &mut TxContext,
    ) {
        event::emit(ActionMarked {
            trace_id,
            semantic_type,
            sender: tx_context::sender(ctx),
        });
    }

    public entry fun mirror_leader_ptb(
        source_trace_id: vector<u8>,
        follower_trace_id: vector<u8>,
        max_exposure_mist: u64,
        ctx: &mut TxContext,
    ) {
        event::emit(CopyTradeMirrored {
            source_trace_id,
            follower_trace_id,
            max_exposure_mist,
            sender: tx_context::sender(ctx),
        });
    }
}
